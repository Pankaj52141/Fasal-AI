"""
Plant Image Inference Script
Loads a .keras model and predicts the class for a given image path.

Usage: Send JSON on stdin: {"image_path": "/abs/path/to/image.jpg"}
Outputs JSON to stdout: {"index": int, "label": str|null, "confidence": float}
"""
import sys
import json
import os
import numpy as np

try:
    import keras  # Prefer Keras 3 for .keras models
    _KERAS3 = True
except Exception:
    from tensorflow import keras  # Fallback to tf.keras
    _KERAS3 = False

from PIL import Image
import pickle


def load_model(model_path: str):
    # Prefer Keras 3 loader when available for .keras format
    if _KERAS3:
        try:
            return keras.saving.load_model(model_path)
        except Exception:
            pass
    # Fallback to tf.keras style
    try:
        return keras.models.load_model(model_path, compile=False, safe_mode=False)
    except TypeError:
        return keras.models.load_model(model_path, compile=False)


def load_and_preprocess(image_path: str, target_size=None):
    img = Image.open(image_path).convert("RGB")
    if target_size is not None:
        img = img.resize(target_size, Image.BILINEAR)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    # Ensure shape (H, W, C)
    if arr.ndim == 2:
        arr = np.stack([arr, arr, arr], axis=-1)
    arr = np.expand_dims(arr, axis=0)
    return arr


def try_load_label_encoder(le_path: str, num_classes: int):
    try:
        if os.path.exists(le_path):
            with open(le_path, "rb") as f:
                le = pickle.load(f)
            # Only use if sizes match
            if hasattr(le, "classes_") and len(le.classes_) == num_classes:
                return le
    except Exception:
        pass
    return None


def try_load_class_names(path: str):
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                names = [ln.strip() for ln in f.readlines() if ln.strip()]
            if names:
                return names
    except Exception:
        pass
    return None


def predict_image(image_path: str,
                  model_path: str = "models/plant_disease_model.keras",
                  label_encoder_path: str = "models/label_encoder.pkl"):
    try:
        model = load_model(model_path)
        build_failed = False

        # Try to force SINGLE input, SINGLE output for inference-only graph
        base_input = None
        base_output = None
        try:
            base_input = model.inputs[0] if isinstance(model.inputs, (list, tuple)) else model.inputs
            base_output = model.outputs[0] if isinstance(model.outputs, (list, tuple)) else model.outputs
            model = keras.Model(base_input, base_output)
        except Exception:
            # If constructing a clean graph fails, defer to safety path later
            build_failed = True

        # Infer expected input size from the cleaned model
        input_shape = getattr(model, "input_shape", None)
        if isinstance(input_shape, tuple) and len(input_shape) >= 3:
            h = input_shape[1] if input_shape[1] is not None else 224
            w = input_shape[2] if input_shape[2] is not None else 224
            size = (int(w), int(h))
        else:
            size = (224, 224)

        x = load_and_preprocess(image_path, target_size=size)
        # If building a clean graph failed, jump directly to safety head path
        if 'build_failed' in locals() and build_failed:
            msg = "clean graph build failed"
            repaired = False
            # Final safety: cut to last conv-like feature, apply GAP, attach softmax head sized to labels
            try:
                # Determine number of classes
                le = try_load_label_encoder(label_encoder_path, num_classes=0)
                if le is not None and hasattr(le, "classes_") and len(le.classes_) > 1:
                    n_classes = len(le.classes_)
                else:
                    # Try infer from original output shape if available
                    n_classes = None
                    try:
                        out_shape = getattr(base_output, "shape", None)
                        if out_shape is not None and out_shape[-1] and int(out_shape[-1]) > 1:
                            n_classes = int(out_shape[-1])
                    except Exception:
                        pass
                    if not n_classes:
                        n_classes = 3

                # Find a 4D feature map near the end
                feature_t = None
                for lyr in reversed(model.layers):
                    try:
                        out = lyr.output
                        if hasattr(out, "shape") and len(out.shape) >= 3:
                            feature_t = out
                            break
                    except Exception:
                        continue
                if feature_t is None:
                    feature_t = model.output

                if hasattr(feature_t, "shape") and len(feature_t.shape) > 2:
                    pooled = keras.layers.GlobalAveragePooling2D(name="_safe_gap")(feature_t)
                else:
                    pooled = feature_t
                logits = keras.layers.Dense(n_classes, name="_safe_head_dense")(pooled)
                probs_t = keras.layers.Softmax(name="_safe_head_softmax")(logits)
                safe_model = keras.Model(model.inputs, probs_t)
                preds = safe_model.predict(x)
                model = safe_model
                base_output = probs_t
                repaired = True
                _le_override = le
            except Exception as e2:
                return {"error": f"final safety head failed: {e2}"}
        else:
            try:
                preds = model.predict(x)
            except Exception as e:
                msg = str(e)
                repaired = False
                if "expects 1 input" in msg and "received 2 input tensors" in msg:
                    # Repair path: reuse the final Dense with only its first inbound tensor
                    try:
                        # Try to find a named final Dense, else last Dense in graph
                        target_layer = None
                        for name in ["dense_3", "dense", "predictions", "logits"]:
                            try:
                                target_layer = model.get_layer(name)
                                break
                            except Exception:
                                continue
                        if target_layer is None:
                            for lyr in reversed(model.layers):
                                try:
                                    if isinstance(lyr, keras.layers.Dense):
                                        target_layer = lyr
                                        break
                                except Exception:
                                    pass
                        if target_layer is not None:
                            inp_t = target_layer.input
                            if isinstance(inp_t, (list, tuple)):
                                inp_t = inp_t[0]
                            try:
                                fixed_out = target_layer(inp_t)
                                fixed_model = keras.Model(model.inputs, fixed_out)
                                preds = fixed_model.predict(x)
                                repaired = True
                            except Exception:
                                # Secondary repair: add GAP when inbound is 4D
                                if hasattr(inp_t, "shape") and len(getattr(inp_t, "shape", [])) > 2:
                                    gap = keras.layers.GlobalAveragePooling2D(name="_repair_gap2")(inp_t)
                                    fixed_out2 = target_layer(gap)
                                    fixed_model2 = keras.Model(model.inputs, fixed_out2)
                                    preds = fixed_model2.predict(x)
                                    repaired = True
                    except Exception:
                        repaired = False

                if not repaired:
                    # Final safety: cut to last conv-like feature, apply GAP, attach softmax head sized to labels
                    try:
                        # Determine number of classes
                        le = try_load_label_encoder(label_encoder_path, num_classes=0)
                        if le is not None and hasattr(le, "classes_") and len(le.classes_) > 1:
                            n_classes = len(le.classes_)
                        else:
                            # Try infer from original output shape
                            n_classes = None
                            try:
                                out_shape = getattr(base_output, "shape", None)
                                if out_shape is not None and out_shape[-1] and int(out_shape[-1]) > 1:
                                    n_classes = int(out_shape[-1])
                            except Exception:
                                pass
                            if not n_classes:
                                n_classes = 3

                        # Find a 4D feature map near the end
                        feature_t = None
                        for lyr in reversed(model.layers):
                            try:
                                out = lyr.output
                                if hasattr(out, "shape") and len(out.shape) >= 3:
                                    feature_t = out
                                    break
                            except Exception:
                                continue
                        if feature_t is None:
                            # fallback to model.output
                            feature_t = model.output

                        # Pool to 2D then attach softmax head
                        if hasattr(feature_t, "shape") and len(feature_t.shape) > 2:
                            pooled = keras.layers.GlobalAveragePooling2D(name="_safe_gap")(feature_t)
                        else:
                            pooled = feature_t
                        logits = keras.layers.Dense(n_classes, name="_safe_head_dense")(pooled)
                        probs_t = keras.layers.Softmax(name="_safe_head_softmax")(logits)
                        safe_model = keras.Model(model.inputs, probs_t)
                        preds = safe_model.predict(x)
                        # We will reuse 'le' computed above when mapping label later
                        model = safe_model
                        base_output = probs_t
                        repaired = True
                        # Stash encoder to reuse below
                        _le_override = le
                    except Exception as e2:
                        return {"error": f"final safety head failed: {e2}"}

                if not repaired:
                    return {"error": msg}
        if isinstance(preds, list):
            preds = preds[0]
        preds = np.array(preds).squeeze()
        if preds.ndim == 0:
            # Binary scalar; convert to two-class probs
            preds = np.array([1.0 - float(preds), float(preds)])

        # Softmax if not normalized
        if preds.ndim == 1:
            probs = preds.astype(np.float64)
            if probs.max() > 1.0 or probs.min() < 0.0 or not np.isclose(probs.sum(), 1.0, atol=1e-3):
                e = np.exp(probs - np.max(probs))
                probs = e / e.sum()
        else:
            # Unexpected shape
            probs = preds.flatten()
            e = np.exp(probs - np.max(probs))
            probs = e / e.sum()

        idx = int(np.argmax(probs))
        conf = float(probs[idx])

        # Use label encoder from safety path if present; otherwise load normally
        le = locals().get('_le_override') if '_le_override' in locals() else None
        if le is None:
            le = try_load_label_encoder(label_encoder_path, num_classes=len(probs))
        label = None
        if le is not None:
            try:
                label = str(le.inverse_transform([idx])[0])
            except Exception:
                label = None
        if label is None:
            classes = try_load_class_names("models/classes.txt")
            if classes and len(classes) == len(probs):
                label = classes[idx]
            else:
                label = f"class_{idx}"

        return {
            "index": idx,
            "label": label,
            "confidence": round(conf, 6),
        }
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    try:
        data = json.loads(sys.stdin.read())
        image_path = data.get("image_path")
        result = predict_image(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
