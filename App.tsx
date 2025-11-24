import React, { useState, useCallback, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Header } from './components/Header';
import { WelcomeDisplay } from './components/WelcomeDisplay';
import { Library } from './components/Library';
import { generateScript, type GenerationOptions } from './services/geminiService';
import type { AnalysisAndScript } from './types';
import { YouTubeIcon } from './components/IconComponents';

type View = 'main' | 'library';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisAndScript | null>(null);
  const [library, setLibrary] = useState<AnalysisAndScript[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('main');

  useEffect(() => {
    try {
      const storedLibrary = localStorage.getItem('scriptLibrary');
      if (storedLibrary) {
        setLibrary(JSON.parse(storedLibrary));
      }
    } catch (e) {
      console.error("Failed to load script library from localStorage", e);
      setLibrary([]);
    }
  }, []);

  const handleGenerate = useCallback(async (options: GenerationOptions) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await generateScript(options);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định. Vui lòng kiểm tra console để biết chi tiết.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveToLibrary = useCallback((resultToSave: AnalysisAndScript) => {
    const newLibrary = [resultToSave, ...library.filter(item => item.id !== resultToSave.id)];
    setLibrary(newLibrary);
    localStorage.setItem('scriptLibrary', JSON.stringify(newLibrary));
  }, [library]);

  const handleDeleteFromLibrary = useCallback((resultId: string) => {
    const newLibrary = library.filter(item => item.id !== resultId);
    setLibrary(newLibrary);
    localStorage.setItem('scriptLibrary', JSON.stringify(newLibrary));
  }, [library]);
  
  const handleLoadFromLibrary = useCallback((resultToLoad: AnalysisAndScript) => {
    setAnalysisResult(resultToLoad);
    setView('main');
  }, []);


  const isResultInLibrary = analysisResult ? library.some(item => item.id === analysisResult.id) : false;

  const renderMainView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="lg:sticky lg:top-8 self-start">
        <InputForm onGenerate={handleGenerate} isLoading={isLoading} />
      </div>
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 min-h-[600px] border border-gray-700 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400 flex items-center shrink-0">
          <YouTubeIcon className="w-8 h-8 mr-3"/>
          PHÂN TÍCH VÀ KỊCH BẢN TỐI ƯU HÓA
        </h2>
        <div className="flex-grow overflow-hidden relative">
          {isLoading && <LoadingSpinner />}
          {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>}
          {!isLoading && !error && analysisResult && (
            <ResultsDisplay 
              result={analysisResult} 
              onSave={handleSaveToLibrary}
              isSaved={isResultInLibrary}
            />
          )}
          {!isLoading && !error && !analysisResult && <WelcomeDisplay />}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header currentView={view} setView={setView} />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {view === 'main' ? renderMainView() : (
          <Library 
            library={library} 
            onLoad={handleLoadFromLibrary} 
            onDelete={handleDeleteFromLibrary}
          />
        )}
      </main>
    </div>
  );
};

export default App;