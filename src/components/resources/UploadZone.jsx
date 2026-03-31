import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { analyzePDF, analyzeDifficulty } from '../../lib/groq';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, RotateCcw, FileText } from 'lucide-react';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();
}

const UploadZone = ({ onUploadStart, onUploadEnd, onError }) => {
  const { addResource } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const fileInputRef = useRef(null);

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(' ') + '\n';
      } catch { text += `[Error on page ${i}]\n`; }
    }
    return text;
  };

  const handleFileUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') { 
      onError?.('Please upload a valid PDF.'); 
      return; 
    }
    if (file.size > 10 * 1024 * 1024) { 
      onError?.('File must be under 10MB.'); 
      return; 
    }

    setIsProcessing(true);
    onUploadStart?.();
    onError?.(null);

    try {
      setProcessingStep('Extracting text...');
      const extractedText = await extractTextFromPDF(file);
      
      setProcessingStep('Analyzing content...');
      const analysis = await analyzePDF(extractedText);

      // Parse key concepts and knowledge gaps from the AI response
      const keyConcepts = [];
      const knowledgeGaps = [];
      const lines = analysis.split('\n');
      let mode = '';
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('key concept')) { mode = 'concepts'; continue; }
        if (lower.includes('knowledge gap')) { mode = 'gaps'; continue; }
        const clean = line.replace(/^[\d\.\-\*•\s]+/, '').trim();
        if (!clean) continue;
        if (mode === 'concepts' && keyConcepts.length < 5) keyConcepts.push(clean);
        if (mode === 'gaps' && knowledgeGaps.length < 5) knowledgeGaps.push(clean);
      }

      setProcessingStep('Mapping difficulty...');
      const difficultyData = await analyzeDifficulty(extractedText);

      setProcessingStep('Done!');
      
      addResource({
        title: file.name.replace('.pdf', ''),
        fileName: file.name,
        extractedText,
        analysis,
        category: 'Study Material',
        keyConcepts,
        knowledgeGaps,
        difficultyData,
        conceptMapData: null,
        quizProgress: { totalAttempts: 0, bestScore: 0, lastAttemptDate: null },
        studyProgress: { flashcardsReviewed: [], conceptsReviewed: [], totalStudyMinutes: 0 },
        chatHistory: []
      });

      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
        onUploadEnd?.();
      }, 500);
    } catch (err) {
      setIsProcessing(false);
      setProcessingStep('');
      onUploadEnd?.();
      if (err.message.includes('taking a breather')) {
        onError?.(err.message, () => handleFileUpload(file));
      } else {
        onError?.(`Failed to process PDF: ${err.message}`);
      }
    }
  };

  return (
    <div>
      <motion.div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
        onClick={() => fileInputRef.current?.click()}
        className="notion-card text-center cursor-pointer transition-all duration-300"
        style={{ 
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--accent-border)'}`,
          background: isDragging ? 'var(--accent-bg)' : undefined
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" onChange={e => { const f = e.target.files[0]; if(f) handleFileUpload(f); }} className="hidden" />
        
        {isProcessing ? (
          <div className="py-4">
            <RotateCcw size={48} className="mx-auto mb-4 animate-spin" style={{ color: 'var(--accent)' }} />
            <h3 className="font-heading text-lg mb-2">{processingStep}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Please wait while AI analyzes your document</p>
          </div>
        ) : (
          <div className="py-4">
            <Upload size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <h3 className="font-heading text-lg mb-2">{isDragging ? 'Drop it!' : 'Upload PDF'}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Drag & drop or click to select · Max 10MB</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadZone;
