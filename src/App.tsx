
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { useAppState } from './hooks/useAppState';
import { useModel } from './hooks/useModel';
import { usePrediction } from './hooks/usePrediction';

export default function App() {
    const appState = useAppState();
    const { status: modelStatus, message: modelMsg, loadModel } = useModel();
    const { predict, calculating, results } = usePrediction();

    const handleLoadModel = async () => {
        const id = appState.modelPreset === 'custom' ? appState.customModelId : appState.modelPreset;
        await loadModel(id, appState.useGpu);
    };

    useEffect(() => {
        handleLoadModel();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCalculate = async () => {
        const sigmaA = appState.useReparamA ? appState.reparamSigma : 0;
        const sigmaB = appState.useReparamB ? appState.reparamSigma : 0;

        await predict(
            appState.sourceAType,
            appState.sourceBType,
            appState.sourceAText,
            appState.sourceBText,
            appState.sourceAFile,
            appState.sourceBFile,
            sigmaA,
            sigmaB,
            appState.textEmbedTypeA,
            appState.textEmbedTypeB,
            appState.videoFps
        );
    };

    return (
        <>
            <Toaster position="top-center" richColors />
            <div className="grid grid-cols-12 h-screen overflow-hidden bg-white text-gray-900 font-sans">
                <Sidebar
                    state={appState}
                    onLoadModel={handleLoadModel}
                    modelStatus={modelStatus}
                    modelStatusMsg={modelMsg}
                />
                <MainContent
                    state={appState}
                    onCalculate={handleCalculate}
                    calculating={calculating}
                    results={results}
                />
            </div>
        </>
    );
}
