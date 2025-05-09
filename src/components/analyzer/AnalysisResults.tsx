'use client';

import { CodeAnalysisResult } from '@/services/ai/analyzer/codebaseAnalyzer';

interface AnalysisResultsProps {
  analysis: CodeAnalysisResult;
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="space-y-8">
      {/* Summary Scores */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analysis Summary</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overall codebase quality assessment
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard
              title="Style Consistency"
              score={analysis.summary.styleConsistency}
              description="How consistent the styling is across the codebase"
            />
            <ScoreCard
              title="Readability"
              score={analysis.summary.readability}
              description="How easy the code is to read and understand"
            />
            <ScoreCard
              title="Maintainability"
              score={analysis.summary.maintainability}
              description="How easy the code is to maintain and extend"
            />
            <ScoreCard
              title="Overall Score"
              score={analysis.summary.overallScore}
              description="Combined assessment of code quality"
              isOverall={true}
            />
          </div>
        </div>
      </div>

      {/* Style Patterns */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Style Patterns</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detected styling patterns in your codebase
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Colors */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Colors</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {analysis.stylePatterns.colors.length > 0 ? (
                  analysis.stylePatterns.colors.map((color, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {color}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 col-span-full">
                    No colors detected
                  </p>
                )}
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Typography</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fonts</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.stylePatterns.typography.fonts.length > 0 ? (
                      analysis.stylePatterns.typography.fonts.map((font, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {font}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No fonts detected</p>
                    )}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Sizes</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.stylePatterns.typography.sizes.length > 0 ? (
                      analysis.stylePatterns.typography.sizes.map((size, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          {size}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No font sizes detected</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Spacing</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.stylePatterns.spacing.length > 0 ? (
                  analysis.stylePatterns.spacing.map((spacing, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    >
                      {spacing}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No spacing patterns detected</p>
                )}
              </div>
            </div>

            {/* Components */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Components</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.stylePatterns.components.length > 0 ? (
                  analysis.stylePatterns.components.map((component, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    >
                      {component}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No components detected</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recommendations</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Suggestions to improve your codebase
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {/* General Recommendations */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">General</h4>
              <ul className="list-disc pl-5 space-y-2">
                {analysis.recommendations.general.length > 0 ? (
                  analysis.recommendations.general.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      {recommendation}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 dark:text-gray-400">No general recommendations</li>
                )}
              </ul>
            </div>

            {/* Style Improvements */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Style Improvements</h4>
              <ul className="list-disc pl-5 space-y-2">
                {analysis.recommendations.styleImprovements.length > 0 ? (
                  analysis.recommendations.styleImprovements.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      {recommendation}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 dark:text-gray-400">No style improvement recommendations</li>
                )}
              </ul>
            </div>

            {/* Structure Improvements */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Structure Improvements</h4>
              <ul className="list-disc pl-5 space-y-2">
                {analysis.recommendations.structureImprovements.length > 0 ? (
                  analysis.recommendations.structureImprovements.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      {recommendation}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 dark:text-gray-400">No structure improvement recommendations</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Technologies */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Detected Technologies</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Frameworks and libraries found in your codebase
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Frameworks */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Frameworks</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.detectedFrameworks.length > 0 ? (
                  analysis.detectedFrameworks.map((framework, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                    >
                      {framework}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No frameworks detected</p>
                )}
              </div>
            </div>

            {/* Libraries */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Libraries</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.detectedLibraries.length > 0 ? (
                  analysis.detectedLibraries.map((library, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                    >
                      {library}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No libraries detected</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScoreCardProps {
  title: string;
  score: number;
  description: string;
  isOverall?: boolean;
}

function ScoreCard({ title, score, description, isOverall = false }: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg ${isOverall ? 'border-2 border-blue-500 dark:border-blue-400' : ''}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-12 w-12 rounded-md flex items-center justify-center ${getScoreBackground(score)}`}>
              <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-white">{score}/100</div>
              </dd>
            </dl>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
              <div
                style={{ width: `${score}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  score >= 80
                    ? 'bg-green-500'
                    : score >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              ></div>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}
