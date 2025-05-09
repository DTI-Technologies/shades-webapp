'use client';

import { useState } from 'react';
import FileUploader from '@/components/analyzer/FileUploader';
import AnalysisResults from '@/components/analyzer/AnalysisResults';
import { CodeAnalysisResult, CodeFile } from '@/services/ai/analyzer/codebaseAnalyzer';

export default function CodebaseAnalyzerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: boolean }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [analysisResults, setAnalysisResults] = useState<CodeAnalysisResult | null>(null);
  const [saveAnalysis, setSaveAnalysis] = useState(true);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);

    // Select all files by default
    const newSelectedFiles: { [key: string]: boolean } = {};
    newFiles.forEach(file => {
      newSelectedFiles[file.name] = true;
    });
    setSelectedFiles(newSelectedFiles);

    // Reset analysis results when new files are selected
    setAnalysisResults(null);
    setError('');
  };

  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }));
  };

  const selectAllFiles = () => {
    const newSelectedFiles: { [key: string]: boolean } = {};
    files.forEach(file => {
      newSelectedFiles[file.name] = true;
    });
    setSelectedFiles(newSelectedFiles);
  };

  const deselectAllFiles = () => {
    const newSelectedFiles: { [key: string]: boolean } = {};
    files.forEach(file => {
      newSelectedFiles[file.name] = false;
    });
    setSelectedFiles(newSelectedFiles);
  };

  const analyzeCodebase = async () => {
    try {
      setIsAnalyzing(true);
      setError('');

      // Get selected files
      const filesToAnalyze = files.filter(file => selectedFiles[file.name]);

      if (filesToAnalyze.length === 0) {
        setError('Please select at least one file to analyze');
        setIsAnalyzing(false);
        return;
      }

      // Read file contents
      const fileContents: CodeFile[] = await Promise.all(
        filesToAnalyze.map(async (file) => {
          const content = await readFileAsText(file);
          return {
            name: file.name,
            path: file.name, // Using filename as path since we don't have full paths
            content,
            language: getLanguageFromFileName(file.name),
          };
        })
      );

      // Send to API
      const response = await fetch('/api/analyze-codebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: fileContents,
          saveAnalysis,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze codebase');
      }

      const data = await response.json();
      setAnalysisResults(data.analysis);
    } catch (error: any) {
      console.error('Error analyzing codebase:', error);
      setError(error.message || 'An error occurred while analyzing the codebase');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file);
    });
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'jsx': 'JavaScript (React)',
      'ts': 'TypeScript',
      'tsx': 'TypeScript (React)',
      'css': 'CSS',
      'scss': 'SCSS',
      'less': 'Less',
      'html': 'HTML',
      'vue': 'Vue',
      'svelte': 'Svelte',
      'json': 'JSON',
      'md': 'Markdown',
    };

    return languageMap[extension] || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Codebase Analyzer
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 sm:mt-4">
            Analyze your codebase for style patterns and get recommendations
          </p>
        </div>

        <div className="space-y-8">
          {/* File Upload Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upload Files</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select files from your codebase to analyze
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <FileUploader onFilesSelected={handleFilesSelected} />
            </div>
          </div>

          {/* File Selection Section */}
          {files.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Selected Files</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {Object.values(selectedFiles).filter(Boolean).length} of {files.length} files selected
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={selectAllFiles}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllFiles}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="max-h-60 overflow-y-auto">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {files.map((file, index) => (
                      <li key={index} className="py-3 flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                          checked={selectedFiles[file.name] || false}
                          onChange={() => toggleFileSelection(file.name)}
                          id={`file-${index}`}
                        />
                        <label
                          htmlFor={`file-${index}`}
                          className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          {file.name}
                        </label>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({getLanguageFromFileName(file.name)})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center">
                  <input
                    id="save-analysis"
                    name="save-analysis"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    checked={saveAnalysis}
                    onChange={(e) => setSaveAnalysis(e.target.checked)}
                  />
                  <label
                    htmlFor="save-analysis"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Save analysis to your account
                  </label>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={analyzeCodebase}
                    disabled={isAnalyzing || Object.values(selectedFiles).filter(Boolean).length === 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Codebase'
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResults && (
            <AnalysisResults analysis={analysisResults} />
          )}
        </div>
      </div>
    </div>
  );
}
