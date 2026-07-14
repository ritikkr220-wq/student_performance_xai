import React, { useState } from 'react';
import { Brain, Upload, BarChart3, Users, AlertCircle, TrendingUp, BookOpen, Code, GraduationCap, ArrowRight, Lightbulb, CheckCircle, XCircle, Mail, ExternalLink, Shield, Settings, Database, Activity, Cpu, Globe, Lock } from 'lucide-react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

const API_URL = 'http://localhost:8002/api';

const RESOURCE_LINKS = {
  'Data Structure': 'https://www.youtube.com/embed/videoseries?si=bDTswTw086b7fk29&list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz',
  'Python': 'https://www.youtube.com/embed/videoseries?si=mUUqbVnyjWQ1fh-h&list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg',
  'Java': 'https://www.youtube.com/embed/xTtL8E4LzTQ?si=3NbYoJTIijAB4Vtk'
};
const MEGA_LINK = "https://mega.nz/folder/FKNlnB6D#9hOs96f7AylcLOGVeoh9Fg/folder/UGtXSLzT";

const getCleanSubjectName = (subject) => {
  return subject.replace('(P)', '').replace('(T)', '').trim();
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
      <p style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '0.4rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '0.15rem 0' }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [modelMetrics, setModelMetrics] = useState(null);
  const [datasetStats, setDatasetStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const studentsRes = await axios.get(`${API_URL}/students`);
        if (studentsRes.data.students && studentsRes.data.students.length > 0) {
          setStudents(studentsRes.data.students);
          try {
            const metricsRes = await axios.get(`${API_URL}/model-metrics`);
            setModelMetrics(metricsRes.data);
          } catch (e) { console.error("Error fetching metrics:", e); }
          try {
            const statsRes = await axios.get(`${API_URL}/dataset-stats`);
            setDatasetStats(statsRes.data);
          } catch (e) { console.error("Error fetching stats:", e); }
          setActiveTab('dashboard');
        }
      } catch (err) {
        // Keep on upload tab if not loaded
      }
    };
    checkStatus();
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); };
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFileUpload({ target: { files: e.dataTransfer.files } });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API_URL}/upload-dataset`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setModelMetrics(response.data.metrics);
      setDatasetStats(response.data.dataset_stats);
      const studentsRes = await axios.get(`${API_URL}/students`);
      setStudents(studentsRes.data.students);
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error uploading file');
    } finally { setLoading(false); }
  };

  const handleStudentSelect = async (e) => {
    const studentId = e.target.value;
    if (!studentId) { setSelectedStudent(null); setPredictionData(null); setSuggestions(null); return; }
    setSelectedStudent(studentId); setLoading(true); setError(null); setSuggestions(null);
    try {
      const [predRes, sugRes] = await Promise.all([
        axios.get(`${API_URL}/predict/${studentId}`),
        axios.get(`${API_URL}/suggestions/${studentId}`)
      ]);
      setPredictionData(predRes.data);
      setSuggestions(sugRes.data);
    } catch (_err) { setError('Error fetching prediction'); }
    finally { setLoading(false); }
  };

  const handleDownloadReport = () => {
    if (!suggestions || !predictionData) return;
    
    let reportContent = `Performance Report for ${getStudentName()}\n`;
    reportContent += `Current Prediction: ${suggestions.original_prediction} (${suggestions.original_pass_probability}% pass probability)\n\n`;
    
    reportContent += `--- Suggestions & Resources ---\n\n`;
    
    if (suggestions.suggestions && suggestions.suggestions.length > 0) {
      suggestions.suggestions.forEach(s => {
        reportContent += `Subject: ${s.subject} (${s.type})\n`;
        reportContent += `Current Marks: ${s.current_marks} -> Target Marks: ${s.target_marks} (+${s.improvement_needed})\n`;
        reportContent += `Tip: ${s.tip}\n`;
        
        const cleanSubject = getCleanSubjectName(s.subject);
        if (RESOURCE_LINKS[cleanSubject]) {
          reportContent += `Video Resource: ${RESOURCE_LINKS[cleanSubject]}\n`;
        }
        reportContent += `\n`;
      });
    } else {
      reportContent += `No specific subject improvements suggested.\n\n`;
    }
    
    reportContent += `--- General Study Material ---\n`;
    reportContent += `Mega Link: ${MEGA_LINK}\n\n`;
    
    if (suggestions.combined_probability) {
      reportContent += `Potential Improvement:\n`;
      reportContent += `If suggestions are followed, probability can change by ${suggestions.combined_change >= 0 ? '+' : ''}${suggestions.combined_change}% to reach ${suggestions.combined_probability}%.\n`;
    }

    const element = document.createElement("a");
    const file = new Blob([reportContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${getStudentName().replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
    
    setReportSent(true); 
    setTimeout(() => setReportSent(false), 3000);
  };

  // Get current student name
  const getStudentName = () => {
    if (predictionData?.student_name) return predictionData.student_name;
    if (suggestions?.student_name) return suggestions.student_name;
    const s = students.find(s => String(s.id) === String(selectedStudent));
    return s ? s.label : `Student ${parseInt(selectedStudent) + 1}`;
  };

  // Build comparison chart data
  let comparisonData = [];
  if (predictionData) {
    const prac = predictionData.practical_features || {};
    const theo = predictionData.theoretical_features || {};
    const allSubjects = new Set([...Object.keys(prac), ...Object.keys(theo)]);
    allSubjects.forEach(sub => {
      comparisonData.push({ subject: sub, Practical: prac[sub] || 0, Theoretical: theo[sub] || 0 });
    });
  }

  // Dataset-level comparison chart
  let datasetComparisonData = [];
  if (datasetStats) {
    const pAvg = datasetStats.practical_averages || {};
    const tAvg = datasetStats.theoretical_averages || {};
    Object.entries(pAvg).forEach(([k, v]) => datasetComparisonData.push({ subject: k, Practical: v, Theoretical: 0 }));
    Object.entries(tAvg).forEach(([k, v]) => {
      const existing = datasetComparisonData.find(d => d.subject === k);
      if (existing) existing.Theoretical = v;
      else datasetComparisonData.push({ subject: k, Practical: 0, Theoretical: v });
    });
  }



  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon"><Brain size={20} color="#fff" /></div>
          <h2>EduPredict XAI</h2>
        </div>
        <div className="nav-links">
          {[
            { key: 'upload', icon: <Upload size={16} />, label: 'Upload Data', disabled: false },
            { key: 'dashboard', icon: <BarChart3 size={16} />, label: 'Dashboard', disabled: !modelMetrics },
            { key: 'predict', icon: <Users size={16} />, label: 'Predict & Explain', disabled: students.length === 0 },
            { key: 'suggestions', icon: <Lightbulb size={16} />, label: 'Suggestions', disabled: !suggestions },
          ].map(tab => (
            <button key={tab.key} className={`btn btn-ghost ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)} disabled={tab.disabled}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="container">
        {error && (
          <div className="glass-panel no-hover" style={{ borderLeft: '4px solid var(--danger)', marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={20} color="var(--danger)" />
              <p style={{ margin: 0, color: 'var(--text-primary)' }}>{error}</p>
            </div>
          </div>
        )}

        {/* ═══════════ UPLOAD TAB ═══════════ */}
        {activeTab === 'upload' && (
          <div className="tab-content" style={{ maxWidth: '700px', margin: '2rem auto' }}>
            <div className="glass-panel text-center">
              <GraduationCap size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
              <h1>Upload Student Dataset</h1>
              <p>Upload a CSV with subject-wise marks to train the XGBoost model and analyze student performance.</p>
              <div className={`upload-area ${isDragging ? 'dragging' : ''}`} style={{ marginTop: '1.5rem' }}
                onClick={() => document.getElementById('fileUpload').click()}
                onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <Upload size={48} className="upload-icon" style={{ color: isDragging ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                <h3 style={{ color: 'var(--text-primary)' }}>{isDragging ? 'Drop file here' : 'Click or drag & drop'}</h3>
                <p style={{ fontSize: '0.85rem' }}>CSV files only • Subject marks with (P) and (T) suffixes</p>
                <input type="file" id="fileUpload" accept=".csv" style={{ display: 'none' }}
                  onChange={(e) => { handleFileUpload(e); e.target.value = null; }} />
              </div>
              {loading && <><div className="spinner"></div><p className="loading-text">Training XGBoost model...</p></>}
            </div>
          </div>
        )}

        {/* ═══════════ DASHBOARD TAB ═══════════ */}
        {activeTab === 'dashboard' && modelMetrics && (
          <div className="tab-content">
            <h1>Model Dashboard</h1>
            <p style={{ marginBottom: '1.5rem' }}>XGBoost Ensemble Model — Performance Overview</p>

            {/* Stats Row */}
            <div className="grid-5" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card accent-blue animate-in animate-in-delay-1">
                <div className="stat-icon blue"><Users size={22} /></div>
                <div className="stat-value gradient-blue">{datasetStats?.total_students || '—'}</div>
                <div className="stat-label">Total Students</div>
              </div>
              <div className="stat-card accent-green animate-in animate-in-delay-2">
                <div className="stat-icon green"><CheckCircle size={22} /></div>
                <div className="stat-value gradient-green">{datasetStats?.pass_count || '—'}</div>
                <div className="stat-label">Passed</div>
              </div>
              <div className="stat-card accent-red animate-in animate-in-delay-3">
                <div className="stat-icon red"><XCircle size={22} /></div>
                <div className="stat-value gradient-red">{datasetStats?.fail_count || '—'}</div>
                <div className="stat-label">Failed</div>
              </div>
              <div className="stat-card accent-purple animate-in animate-in-delay-4">
                <div className="stat-icon purple"><Code size={22} /></div>
                <div className="stat-value gradient-purple">{datasetStats?.practical_overall_avg || '—'}</div>
                <div className="stat-label">Practical Avg</div>
              </div>
              <div className="stat-card accent-warning animate-in animate-in-delay-5">
                <div className="stat-icon warning"><BookOpen size={22} /></div>
                <div className="stat-value gradient-warning">{datasetStats?.theoretical_overall_avg || '—'}</div>
                <div className="stat-label">Theory Avg</div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="metrics-grid">
              {['accuracy', 'precision', 'recall', 'f1_score'].map(m => (
                <div key={m} className="glass-panel metric-card">
                  <p style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.replace('_', ' ')}</p>
                  <div className="metric-value">{(modelMetrics[m] * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>

            {/* Dataset Comparison Chart */}
            {datasetComparisonData.length > 0 && (
              <div className="glass-panel no-hover" style={{ marginBottom: '1.5rem' }}>
                <h2>Subject-wise Class Average — Practical vs Theoretical</h2>
                <p>Red bars = Practical subjects, Blue bars = Theoretical subjects</p>
                <div className="chart-legend">
                  <div className="legend-item"><div className="legend-dot red"></div>Practical Skills</div>
                  <div className="legend-item"><div className="legend-dot blue"></div>Theoretical Skills</div>
                </div>
                <div style={{ height: '380px', width: '100%' }}>
                  <ResponsiveContainer>
                    <BarChart data={datasetComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="subject" angle={-35} textAnchor="end" height={80} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8' }} domain={[0, 100]} label={{ value: 'Average Marks', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="Practical" name="Practical" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Theoretical" name="Theoretical" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Subject Stats Table */}
            {datasetStats?.subject_stats && (
              <div className="glass-panel no-hover">
                <h2>Subject Statistics</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="subject-table">
                    <thead><tr><th>Subject</th><th>Type</th><th>Mean</th><th>Median</th><th>Std Dev</th><th>Min</th><th>Max</th><th>Below 40</th></tr></thead>
                    <tbody>
                      {datasetStats.subject_stats.map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</td>
                          <td><span className={`type-badge ${s.type.toLowerCase()}`}>{s.type}</span></td>
                          <td>{s.mean}</td><td>{s.median}</td><td>{s.std}</td><td>{s.min}</td><td>{s.max}</td>
                          <td style={{ color: s.below_pass > 20 ? 'var(--danger)' : 'var(--text-secondary)' }}>{s.below_pass}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="glass-panel" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <h3>Ready to Predict?</h3>
              <p>Select a student to get AI-powered predictions and personalized suggestions.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('predict')}>
                <TrendingUp size={18} /> Start Predicting
              </button>
            </div>
          </div>
        )} 

        {/* ═══════════ PREDICT TAB ═══════════ */}
        {activeTab === 'predict' && (
          <div className="tab-content">
            <h1>Predict & Explain</h1>
            <p style={{ marginBottom: '1.5rem' }}>Select a student for AI prediction with SHAP explainability</p>

            <div className="grid-2">
              <div className="glass-panel">
                <h2>Select Student</h2>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Student Record</label>
                  <select className="form-control" onChange={handleStudentSelect} value={selectedStudent || ''}>
                    <option value="">— Select Student —</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.label} (P: {s.practical_avg} | T: {s.theoretical_avg})</option>
                    ))}
                  </select>
                </div>

                {loading && <><div className="spinner"></div><p className="loading-text">Analyzing student...</p></>}

                {predictionData && !loading && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3>Prediction Result for {getStudentName()}</h3>
                    <div className={`prediction-badge ${predictionData.prediction_label === 'Pass' ? 'prediction-safe' : 'prediction-at-risk'}`}>
                      {predictionData.prediction_label === 'Pass' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      {predictionData.prediction_label === 'Pass' ? 'Likely to Pass' : 'At Risk — May Fail'}
                    </div>
                    <p>Confidence: <strong style={{ color: 'var(--text-primary)' }}>{(predictionData.probability * 100).toFixed(1)}%</strong></p>

                    {/* Show suggestions button for ALL students */}
                    {suggestions && (
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => setActiveTab('suggestions')}>
                          <Lightbulb size={16} />
                          {predictionData.prediction_label === 'Pass' ? 'View Excellence Tips' : 'View Improvement Suggestions'}
                        </button>
                        <button
                          className={`btn ${reportSent ? 'btn-success' : 'btn-outline'}`}
                          onClick={handleDownloadReport}
                          style={{
                            borderColor: reportSent ? 'var(--success)' : 'rgba(255,255,255,0.2)',
                            color: reportSent ? 'var(--success)' : 'var(--text-primary)',
                            backgroundColor: reportSent ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                          }}
                        >
                          {reportSent ? <CheckCircle size={16} /> : <Mail size={16} />}
                          {reportSent ? 'Report Downloaded' : 'Send this report to Student'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Student Marks Chart */}
              {predictionData && comparisonData.length > 0 && (
                <div className="glass-panel no-hover">
                  <h2>Practical vs Theoretical Performance</h2>
                  <p>Red = Practical Skills &nbsp;|&nbsp; Blue = Theoretical Skills</p>
                  <div className="chart-legend">
                    <div className="legend-item"><div className="legend-dot red"></div>Practical</div>
                    <div className="legend-item"><div className="legend-dot blue"></div>Theoretical</div>
                  </div>
                  <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer>
                      <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="subject" angle={-35} textAnchor="end" height={80} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="Practical" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Theoretical" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* SHAP Chart */}
            {predictionData?.shap_values && (
              <div className="glass-panel no-hover" style={{ marginTop: '1.5rem' }}>
                <h2>Explainable AI — SHAP Feature Impact</h2>
                <p>Blue pushes toward Pass, Red pushes toward Fail</p>
                <div style={{ height: '400px', width: '100%', marginTop: '1rem' }}>
                  <ResponsiveContainer>
                    <BarChart layout="vertical" data={predictionData.shap_values.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis type="number" tick={{ fill: '#94a3b8' }} />
                      <YAxis dataKey="feature" type="category" width={160} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <RechartsTooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                            <p style={{ color: '#f1f5f9', fontWeight: 600 }}>{d.feature}</p>
                            <p style={{ color: '#94a3b8', margin: '0.15rem 0' }}>Value: {d.feature_value}</p>
                            <p style={{ color: d.value > 0 ? '#3b82f6' : '#ef4444' }}>Impact: {d.value.toFixed(4)}</p>
                          </div>
                        );
                      }} />
                      <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                        {predictionData.shap_values.slice(0, 10).map((entry, i) => (
                          <Cell key={i} fill={entry.value > 0 ? '#3b82f6' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ SUGGESTIONS TAB ═══════════ */}
        {activeTab === 'suggestions' && suggestions && (
          <div className="tab-content">
            <h1>{suggestions.is_passing ? '🌟 Excellence Roadmap' : '📈 Improvement Suggestions'}</h1>
            <p style={{ marginBottom: '1.5rem' }}>
              Personalized recommendations for <strong style={{ color: 'var(--text-primary)' }}>{getStudentName()}</strong> —
              Current prediction: <span style={{ color: suggestions.original_prediction === 'Pass' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{suggestions.original_prediction}</span>
              &nbsp;({suggestions.original_pass_probability}% pass probability)
            </p>

            {suggestions.is_passing && (
              <div className="glass-panel no-hover" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--success)', padding: '1rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle size={20} color="var(--success)" />
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                    Great job! You're on track to pass. Here are suggestions to push your performance even higher and aim for distinction.
                  </p>
                </div>
              </div>
            )}

            <div className="grid-2">
              <div>
                {suggestions.suggestions.map((s, i) => (
                  <div key={i} className={`suggestion-card ${s.type === 'Practical' ? 'practical' : 'theoretical'}`}
                    style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="suggestion-header">
                      <span className="suggestion-subject">{s.subject}</span>
                      <span className={`suggestion-type ${s.type.toLowerCase()}`}>{s.type}</span>
                    </div>
                    <div className="suggestion-marks">
                      <span className="marks-current">{s.current_marks}</span>
                      <ArrowRight size={16} className="marks-arrow" />
                      <span className="marks-target">{s.target_marks}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(+{s.improvement_needed} marks)</span>
                    </div>
                    <div className="suggestion-tip">💡 {s.tip}</div>

                    {/* Resources Section */}
                    <div className="suggestion-resources" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BookOpen size={14} /> Recommended Resources
                      </h4>

                      {RESOURCE_LINKS[getCleanSubjectName(s.subject)] && (
                        <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
                          <iframe
                            width="100%"
                            height="200"
                            src={RESOURCE_LINKS[getCleanSubjectName(s.subject)]}
                            title={`${getCleanSubjectName(s.subject)} Tutorial`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}

                      <a
                        href={MEGA_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.85rem', padding: '0.5rem' }}
                      >
                        <ExternalLink size={14} /> Access Study Material
                      </a>
                    </div>

                    <div className="probability-bar-container" style={{ marginTop: '1rem' }}>
                      <div className="probability-labels">
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Before: {s.probability_before}%</span>
                        <span className={`prob-change ${s.probability_change >= 0 ? 'positive' : 'negative'}`}>
                          {s.probability_change >= 0 ? '+' : ''}{s.probability_change}%
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>After: {s.probability_after}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div className="probability-bar" style={{ flex: 1 }}>
                          <div className="probability-fill before" style={{ width: `${s.probability_before}%` }}></div>
                        </div>
                        <div className="probability-bar" style={{ flex: 1 }}>
                          <div className="probability-fill after" style={{ width: `${s.probability_after}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                {/* Combined improvement result */}
                <div className="combined-result">
                  <h3>{suggestions.is_passing ? '🚀 With Further Excellence' : '✨ If ALL Suggestions Are Followed'}</h3>
                  <div className="combined-prob">{suggestions.combined_probability}%</div>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>Pass Probability</p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <span className={`prob-change ${suggestions.combined_change >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.1rem' }}>
                      {suggestions.combined_change >= 0 ? '↑ +' : '↓ '}{suggestions.combined_change}%
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>improvement</span>
                  </p>
                  <div className={`prediction-badge ${suggestions.combined_prediction === 'Pass' ? 'prediction-safe' : 'prediction-at-risk'}`} style={{ marginTop: '1rem' }}>
                    {suggestions.combined_prediction === 'Pass' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    {suggestions.combined_prediction === 'Pass' ? 'Would PASS ✓' : 'Still at Risk'}
                  </div>
                </div>

                {/* Probability comparison chart */}
                <div className="glass-panel no-hover" style={{ marginTop: '1.5rem' }}>
                  <h3>Probability Change per Suggestion</h3>
                  <div style={{ height: '320px', width: '100%', marginTop: '1rem' }}>
                    <ResponsiveContainer>
                      <BarChart data={suggestions.suggestions.map(s => ({
                        subject: s.subject.replace('(P)', '').replace('(T)', '').trim(),
                        change: s.probability_change,
                        type: s.type
                      }))} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="subject" angle={-35} textAnchor="end" height={70} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#94a3b8' }} label={{ value: 'Probability Change (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="change" name="Prob Change %" radius={[4, 4, 0, 0]}>
                          {suggestions.suggestions.map((s, i) => (
                            <Cell key={i} fill={s.type === 'Practical' ? '#ef4444' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default App;
