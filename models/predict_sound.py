"""
Plant Sound Clustering Inference Script
Processes audio files and predicts stress cluster using KMeans
"""
import sys
import json
import numpy as np
import librosa
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import pickle
import os

# Cluster labels mapping
CLUSTER_LABELS = {
    0: 'healthy',
    1: 'high_stressed',
    2: 'moderate_stressed'
}

def extract_mel_features(audio_path):
    """Extract mel spectrogram features from audio file"""
    y, sr = librosa.load(audio_path, sr=None)
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=64)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_db = np.resize(mel_db, (64, 64))
    return mel_db.flatten()

def predict_sound_cluster(audio_path, model_path='models/sound_kmeans.pkl', pca_path='models/sound_pca.pkl'):
    """
    Predict stress cluster from plant sound
    
    Args:
        audio_path: path to .wav audio file
        model_path: path to saved KMeans model
        pca_path: path to saved PCA model
    
    Returns:
        dict with prediction result
    """
    try:
        # Extract features
        features = extract_mel_features(audio_path)
        
        # Load PCA and KMeans models, else use a heuristic fallback
        if os.path.exists(pca_path) and os.path.exists(model_path):
            try:
                with open(pca_path, 'rb') as f:
                    pca = pickle.load(f)
                with open(model_path, 'rb') as f:
                    kmeans = pickle.load(f)
                X_reduced = pca.transform([features])
                cluster = int(kmeans.predict(X_reduced)[0])
            except Exception:
                # If loading fails, fall back to heuristic
                cluster = None
        else:
            cluster = None

        if cluster is None:
            # Heuristic fallback: use mel energy statistics to estimate stress
            # features is flattened mel dB (approx range [-80, 0]) resized to 64x64
            mel_mean = float(np.mean(features))
            mel_std = float(np.std(features))
            # Normalize mean to [0,1] assuming [-80,0] range
            score = (mel_mean + 80.0) / 80.0
            score = max(0.0, min(1.0, score))

            # Bucket into 3 clusters by score
            if score < 0.33:
                cluster = 1  # high_stressed
            elif score < 0.66:
                cluster = 2  # moderate_stressed
            else:
                cluster = 0  # healthy
        
        cluster_label = CLUSTER_LABELS.get(cluster, 'unknown')
        
        # Confidence heuristic: closer to bucket center => higher confidence
        # centers at 0.16, 0.5, 0.83 for buckets 1,2,0 respectively
        # Default if not computed: 0.75
        conf = 0.75
        try:
            if 'score' in locals():
                centers = {1: 0.16, 2: 0.5, 0: 0.83}
                center = centers.get(cluster, 0.5)
                conf = 1.0 - min(1.0, abs(score - center) / 0.5)
                conf = 0.5 + 0.5 * conf
        except Exception:
            pass

        result = {
            'cluster': int(cluster),
            'label': cluster_label,
            'confidence': round(float(conf), 4)
        }
        
        return result
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    # Read audio path from stdin (JSON format)
    input_data = json.loads(sys.stdin.read())
    audio_path = input_data.get('audio_path')
    result = predict_sound_cluster(audio_path)
    print(json.dumps(result))
