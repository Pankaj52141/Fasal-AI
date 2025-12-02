"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/user-context"
import { AlertCircle, CheckCircle, Activity, TrendingUp, AlertTriangle } from "lucide-react"

export default function AnalyzeWidget() {
  const { user } = useUser()
  const [image, setImage] = useState<File | null>(null)
  const [sound, setSound] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [analysisType, setAnalysisType] = useState<'image' | 'sound' | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const handleSoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSound(e.target.files[0])
    }
  }

  const analyzeImage = async () => {
    if (!image || !user) return
    setLoading(true)
    setAnalysisType('image')
    const formData = new FormData()
    formData.append('image', image)
    formData.append('farmerId', user.id)
    const res = await fetch('/api/analyze/image', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    setResult(data.analysis)
    setLoading(false)
  }

  const analyzeSound = async () => {
    if (!sound || !user) return
    setLoading(true)
    setAnalysisType('sound')
    const formData = new FormData()
    formData.append('sound', sound)
    formData.append('farmerId', user.id)
    const res = await fetch('/api/analyze/sound', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    setResult(data.analysis)
    setLoading(false)
  }

  const getStressLevel = (label: string) => {
    if (label.includes('healthy') || label.includes('no_stress')) {
      return { 
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        title: 'Healthy',
        description: 'Plant is in good condition'
      }
    } else if (label.includes('moderate')) {
      return { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: AlertTriangle,
        title: 'Moderate Stress',
        description: 'Plant shows signs of stress, monitor closely'
      }
    } else if (label.includes('severe') || label.includes('stressed')) {
      return { 
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: AlertCircle,
        title: 'Severe Stress',
        description: 'Immediate attention required'
      }
    }
    return { 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Activity,
      title: 'Analysis Complete',
      description: 'Review the results below'
    }
  }

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Analyze Plant Data</h2>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Upload Plant Image</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <Button className="mt-2" onClick={analyzeImage} disabled={!image || loading}>
          Analyze Image
        </Button>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Upload Plant Sound (.wav)</label>
        <input type="file" accept="audio/wav" onChange={handleSoundChange} />
        <Button className="mt-2" onClick={analyzeSound} disabled={!sound || loading}>
          Analyze Sound
        </Button>
      </div>
      {loading && (
        <div className="mt-4 p-6 border rounded-lg bg-blue-50 border-blue-200 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-blue-800 font-medium">Analyzing your plant data...</p>
        </div>
      )}
      
      {result && !loading && (
        <div className="mt-6 space-y-4">
          <div className={`p-6 border-2 rounded-lg ${getStressLevel(result.label).color}`}>
            <div className="flex items-start gap-4">
              {(() => {
                const StressIcon = getStressLevel(result.label).icon
                return <StressIcon className="w-8 h-8 flex-shrink-0 mt-1" />
              })()}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">{getStressLevel(result.label).title}</h3>
                  <Badge variant="outline" className="text-sm bg-white/80 text-blue-700 border-blue-300">
                    {analysisType === 'sound' ? 'Audio Analysis' : 'Image Analysis'}
                  </Badge>
                </div>
                <p className="text-sm mb-4 text-gray-800">{getStressLevel(result.label).description}</p>
                
                {/* Confidence Score */}
                <div className="bg-white/60 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">Confidence Level</span>
                    <span className="text-lg font-bold text-gray-900">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Cluster Information */}
                {result.cluster !== undefined && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-4">
                      <p className="text-xs text-gray-700 mb-1">Analysis Cluster</p>
                      <p className="text-2xl font-bold text-gray-900">#{result.cluster}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-4">
                      <p className="text-xs text-gray-700 mb-1">Status Label</p>
                      <p className="text-sm font-semibold capitalize text-gray-900">{result.label.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-bold text-gray-900">Recommendations</h4>
            </div>
            <ul className="space-y-2">
              {result.label.includes('healthy') || result.label.includes('no_stress') ? (
                <>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Continue current care practices</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Regular monitoring every 3-5 days</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Maintain optimal water and nutrient levels</span>
                  </li>
                </>
              ) : result.label.includes('moderate') ? (
                <>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-yellow-600 mt-0.5">⚠</span>
                    <span>Check soil moisture levels and adjust irrigation</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-yellow-600 mt-0.5">⚠</span>
                    <span>Inspect for pest or disease symptoms</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-yellow-600 mt-0.5">⚠</span>
                    <span>Consider foliar spray with micronutrients</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-yellow-600 mt-0.5">⚠</span>
                    <span>Monitor daily for next 7 days</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span>Immediate intervention required</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span>Consult agronomist for treatment plan</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span>Test soil and water quality immediately</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span>Apply appropriate fungicide/pesticide if needed</span>
                  </li>
                </>
              )}
            </ul>
          </Card>
        </div>
      )}
    </Card>
  )
}
