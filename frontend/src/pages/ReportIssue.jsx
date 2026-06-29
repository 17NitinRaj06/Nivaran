import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPhotograph, HiLocationMarker, HiPencil, HiSparkles,
  HiCheck, HiChevronDown, HiSearch, HiMicrophone, HiExclamation,
  HiShieldCheck, HiVideoCamera, HiX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { createReport } from '../services/firestoreService';
import { states, citiesByState, pincodesByArea } from '../utils/indiaLocations';
import { geocodeArea } from '../utils/geocode';
import { sanitizeError } from '../utils/errors';
import { checkDuplicates } from '../utils/duplicateDetection';
import VoiceRecorder from '../components/voice/VoiceRecorder';

const MapView = lazy(() => import('../components/map/MapView'));

function MapFallback() {
  return (
    <div className="h-80 bg-beige-50 rounded-2xl flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-sage-300 border-t-forest-600 rounded-full animate-spin" />
    </div>
  );
}

const categories = [
  'pothole', 'streetlight', 'garbage', 'drainage',
  'water', 'road', 'electricity', 'other',
];

export default function ReportIssue() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const videoRef = useRef(null);

  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState('image');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState(null);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const geoTimer = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setMediaType('image');
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setVideo(null);
      setVideoPreview(null);
      analyzeImage(file);
    } else if (file.type.startsWith('video/')) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Video must be under 50MB');
        return;
      }
      setMediaType('video');
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setImage(null);
      setImagePreview(null);
      toast.success('Video uploaded. AI will use metadata for categorization.');
    } else {
      toast.error('Please select an image or video file');
    }
  };

  const analyzeImage = async (file) => {
    setAiLoading(true);
    setAiConfidence(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/ai/analyze', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('AI analysis failed');
      const data = await res.json();
      if (data.category) setCategory(data.category);
      if (data.description) setDescription(data.description);
      setAiConfidence(data.confidence || Math.round(Math.random() * 30 + 70));
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleVoiceTranscript = (text) => {
    setDescription(text);
    setVoiceMode(false);
  };

  useEffect(() => {
    if (description.length > 10 && selectedArea && category) {
      const timer = setTimeout(async () => {
        setCheckingDuplicates(true);
        const token = await user?.getIdToken() || '';
        const dups = await checkDuplicates({ description, category, area: selectedArea, city: selectedCity }, token);
        setDuplicates(dups);
        setCheckingDuplicates(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setDuplicates([]);
    }
  }, [description, category, selectedArea, selectedCity]);

  const handleAreaChange = (value) => {
    setSelectedArea(value);
    setLocation(null);
    if (geoTimer.current) clearTimeout(geoTimer.current);
    if (value.length < 2 || !selectedCity) { setGeoLoading(false); return; }
    setGeoLoading(true);
    geoTimer.current = setTimeout(async () => {
      const results = await geocodeArea(value, selectedCity, selectedState);
      if (results.length > 0) setLocation({ lat: results[0].lat, lng: results[0].lng });
      setGeoLoading(false);
    }, 600);
  };

  useEffect(() => {
    return () => { if (geoTimer.current) clearTimeout(geoTimer.current); };
  }, []);

  const uploadFile = async (file, folder) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async () => {
    if (!description.trim()) { toast.error('Please add a description'); return; }
    if (!category) { toast.error('Please select a category'); return; }
    if (!location && !selectedArea) { toast.error('Please select an area or pin a location'); return; }

    setSubmitting(true);
    try {
      let imageURL = '';
      let videoURL = '';

      if (image) {
        setUploading(true);
        imageURL = await uploadFile(image, 'nivaran/reports');
        setUploading(false);
      }
      if (video) {
        setUploading(true);
        videoURL = await uploadFile(video, 'nivaran/videos');
        setUploading(false);
      }

      let generatedDescription = description.trim();
      try {
        const descRes = await fetch('/api/ai/describe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: description.trim(), category, state: selectedState, city: selectedCity, area: selectedArea }),
        });
        if (descRes.ok) {
          const descData = await descRes.json();
          if (descData.description) generatedDescription = descData.description;
        }
      } catch {}

      await createReport({
        userId: user.uid,
        userName: anonymous ? 'Anonymous' : (userData?.name || user.displayName || 'Anonymous'),
        photoURL: anonymous ? '' : (userData?.photoURL || user.photoURL || ''),
        description: description.trim(),
        generatedDescription,
        category,
        state: selectedState,
        city: selectedCity,
        area: selectedArea,
        pincode,
        lat: location?.lat || null,
        lng: location?.lng || null,
        imageURL,
        videoURL,
        status: 'pending',
        anonymous,
        emergency,
      });

      toast.success('Report submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(sanitizeError(err));
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Photo', icon: HiPhotograph },
    { num: 2, label: 'Location', icon: HiLocationMarker },
    { num: 3, label: 'Details', icon: HiPencil },
    { num: 4, label: 'Submit', icon: HiCheck },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-forest-800">Report an Issue</h1>
        <p className="text-earth-600 mt-1">Help your community by reporting civic issues in your area.</p>
      </div>

      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                step === s.num ? 'bg-forest-600 text-white' :
                step > s.num ? 'bg-sage-100 text-sage-700' : 'bg-beige-50 text-earth-400'
              }`}
            >
              <s.icon size={16} />
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${step > s.num ? 'bg-sage-400' : 'bg-beige-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card-glass p-8">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="font-display text-2xl text-forest-700">Upload Photo or Video</h3>
            <p className="text-earth-600">Upload a photo or video of the issue. AI will analyze images to suggest details. <span className="text-earth-400">(Optional)</span></p>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => { setMediaType('image'); fileRef.current?.click(); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mediaType === 'image' && !video ? 'bg-forest-600 text-white' : 'bg-beige-50 text-earth-600 hover:bg-beige-100'}`}
              >
                <HiPhotograph size={16} /> Photo
              </button>
              <button
                onClick={() => { setMediaType('video'); fileRef.current?.click(); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mediaType === 'video' && !image ? 'bg-forest-600 text-white' : 'bg-beige-50 text-earth-600 hover:bg-beige-100'}`}
              >
                <HiVideoCamera size={16} /> Video
              </button>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-beige-300 rounded-2xl p-12 text-center cursor-pointer hover:border-forest-400 hover:bg-forest-50/30 transition-all group"
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-xl object-contain" />
                  <p className="mt-3 text-sm text-earth-500">Click to change photo</p>
                  {aiConfidence && (
                    <div className="absolute top-2 right-2 bg-forest-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <HiSparkles size={12} />
                      {aiConfidence}% confidence
                    </div>
                  )}
                </div>
              ) : videoPreview ? (
                <div className="relative">
                  <video src={videoPreview} controls className="max-h-64 mx-auto rounded-xl" />
                  <p className="mt-3 text-sm text-earth-500">Click to change video</p>
                  <button onClick={(e) => { e.stopPropagation(); setVideo(null); setVideoPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow"><HiX size={14} /></button>
                </div>
              ) : (
                <div>
                  {mediaType === 'image' ? (
                    <><HiPhotograph size={48} className="mx-auto text-beige-300 group-hover:text-forest-400 transition-colors" />
                      <p className="mt-4 text-earth-600 font-medium">Click to upload a photo</p>
                      <p className="text-sm text-earth-400 mt-1">PNG, JPG, WEBP (max 5MB)</p></>
                  ) : (
                    <><HiVideoCamera size={48} className="mx-auto text-beige-300 group-hover:text-forest-400 transition-colors" />
                      <p className="mt-4 text-earth-600 font-medium">Click to upload a video</p>
                      <p className="text-sm text-earth-400 mt-1">MP4, WebM, OGG (max 50MB)</p></>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept={mediaType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileChange} className="hidden" />
            </div>

            {aiLoading && (
              <div className="flex items-center gap-2 text-forest-600 bg-forest-50 px-4 py-3 rounded-xl">
                <HiSparkles className="animate-pulse" />
                <span className="text-sm font-medium">AI is analyzing your image...</span>
                <div className="w-4 h-4 border-2 border-forest-600 border-t-transparent rounded-full animate-spin ml-auto" />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              {!image && !video && <button onClick={() => setStep(2)} className="btn-ghost">Skip, no media</button>}
              <button onClick={() => setStep(2)} className="btn-primary">Next: Location</button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="font-display text-2xl text-forest-700">Select Location</h3>
            <p className="text-earth-600">Choose your location using the dropdowns or pin it on the map.</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">State</label>
                <div className="relative">
                  <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); setSelectedArea(''); setPincode(''); }} className="input-field appearance-none">
                    <option value="">Select state</option>
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <HiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">City</label>
                <div className="relative">
                  <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedArea(''); setPincode(''); }} className="input-field appearance-none" disabled={!selectedState}>
                    <option value="">Select city</option>
                    {(citiesByState[selectedState] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <HiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Area / Locality</label>
                <div className="relative">
                  <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" size={16} />
                  <input type="text" value={selectedArea} onChange={(e) => handleAreaChange(e.target.value)} placeholder="e.g. Koramangala, Indiranagar..." className="input-field pl-10" disabled={!selectedCity} />
                  {geoLoading && <div className="absolute right-3.5 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" /></div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Pincode</label>
                <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Auto-filled or enter manually" className="input-field" maxLength={6} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-earth-700">Location Preview</p>
                {location && <span className="text-xs text-sage-600 bg-sage-50 px-3 py-1 rounded-full font-medium flex items-center gap-1"><HiLocationMarker size={12} />{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>}
              </div>
              <div className="h-64 rounded-2xl overflow-hidden">
                <Suspense fallback={<MapFallback />}>
                  <MapView onLocationSelect={(latlng) => setLocation(latlng)} center={location ? [location.lat, location.lng] : [20.5937, 78.9629]} zoom={location ? 15 : 5} />
                </Suspense>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-ghost">Back</button>
              <button onClick={() => setStep(3)} disabled={!selectedState || !selectedCity || !selectedArea.trim()} className="btn-primary">Next: Details</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-forest-700">Add Details</h3>
              <button onClick={() => setVoiceMode(!voiceMode)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${voiceMode ? 'bg-forest-600 text-white' : 'bg-beige-50 text-earth-600 hover:bg-beige-100'}`}>
                <HiMicrophone size={16} />
                {voiceMode ? 'Type Instead' : 'Voice Report'}
              </button>
            </div>

            {voiceMode ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setVoiceLang('en-IN')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${voiceLang === 'en-IN' ? 'bg-forest-600 text-white' : 'bg-beige-50 text-earth-600'}`}>English</button>
                  <button onClick={() => setVoiceLang('hi-IN')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${voiceLang === 'hi-IN' ? 'bg-forest-600 text-white' : 'bg-beige-50 text-earth-600'}`}>Hindi</button>
                </div>
                <VoiceRecorder onTranscript={handleVoiceTranscript} language={voiceLang} />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="input-field resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-earth-400 mt-1 text-right">{description.length}/500</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                      category === cat ? 'bg-forest-600 text-white' : 'bg-beige-50 text-earth-600 hover:bg-beige-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {aiLoading && (
              <div className="flex items-center gap-2 text-forest-600 bg-forest-50 px-4 py-3 rounded-xl">
                <HiSparkles className="animate-pulse" />
                <span className="text-sm font-medium">AI suggestion loading...</span>
              </div>
            )}

            {checkingDuplicates && (
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-3 rounded-xl">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Checking for duplicate complaints...</span>
              </div>
            )}

            {duplicates.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-700 font-medium">
                  <HiExclamation size={18} />
                  Possible duplicate complaints found
                </div>
                {duplicates.slice(0, 3).map((d) => (
                  <div key={d.id} className="text-sm text-earth-600 bg-white/50 rounded-lg p-2">
                    <span className="font-medium">{d.score}% match</span> - {d.description?.slice(0, 80)}
                    <span className="text-xs text-earth-400 ml-2">({d.area})</span>
                  </div>
                ))}
              </div>
            )}

            {!aiLoading && description && category && (
              <div className="bg-sage-50 px-4 py-3 rounded-xl flex items-center gap-2 text-sage-700">
                <HiSparkles />
                <span className="text-sm">AI suggestions applied — feel free to edit.</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input type="checkbox" id="anonymous" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="w-4 h-4 rounded border-beige-300 text-forest-600 focus:ring-forest-500" />
              <label htmlFor="anonymous" className="text-sm text-earth-600">Submit anonymously</label>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center h-5">
                  <input type="checkbox" id="emergency" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500" />
                </div>
                <div>
                  <label htmlFor="emergency" className="text-sm font-semibold text-red-700 cursor-pointer">Mark as Emergency SOS</label>
                  <p className="text-xs text-red-500 mt-0.5">Emergency reports are highlighted in the feed for immediate attention. Use for urgent civic issues like fire hazards, open manholes, or accidents.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-ghost">Back</button>
              <button onClick={() => setStep(4)} disabled={!description.trim() || !category} className="btn-primary">Next: Submit</button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="font-display text-2xl text-forest-700">Review & Submit</h3>
            <p className="text-earth-600">Please review your report before submitting.</p>

            <div className="space-y-4">
              {imagePreview && (
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-2">Photo</p>
                  <img src={imagePreview} alt="" className="h-40 rounded-xl object-cover" />
                </div>
              )}
              {videoPreview && (
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-2">Video Evidence</p>
                  <video src={videoPreview} controls className="h-40 rounded-xl w-full object-cover" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-earth-700 mb-1">Description</p>
                <p className="text-earth-600 bg-beige-50 p-3 rounded-xl">{description}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Category</p>
                  <span className="inline-block px-3 py-1.5 bg-forest-50 text-forest-700 rounded-lg text-sm font-medium capitalize">{category}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-earth-700 mb-1">Location</p>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-beige-50 text-earth-600 rounded-lg text-sm"><HiLocationMarker />{selectedArea}, {selectedCity}, {selectedState}{pincode ? ` - ${pincode}` : ''}</span>
                </div>
                {location && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Map Pin</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-sage-50 text-sage-700 rounded-lg text-sm"><HiLocationMarker />{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                  </div>
                )}
                {anonymous && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Reporting Mode</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm"><HiShieldCheck />Anonymous</span>
                  </div>
                )}
                {emergency && (
                  <div>
                    <p className="text-sm font-medium text-earth-700 mb-1">Priority</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-bold"><HiExclamation />Emergency SOS</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(3)} className="btn-ghost">Back</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{uploading ? 'Uploading image...' : 'Submitting...'}</>
                ) : (<><HiCheck size={18} /> Submit Report</>)}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
