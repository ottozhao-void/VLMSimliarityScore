
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { useAppState } from './hooks/useAppState';
import { useModel } from './hooks/useModel';
import { usePrediction } from './hooks/usePrediction';

export default function App() {
    const appState = useAppState();
    const { status: modelStatus, message: modelMsg, loadModel } = useModel();
    const { predict, calculating, results, error } = usePrediction();

    const handleLoadModel = async () => {
        await loadModel(appState.modelPreset, appState.customModelId, appState.useGpu);
    };

    const handleCalculate = async () => {
        await predict(
            appState.sourceAType,
            appState.sourceBType,
            appState.sourceAText,
            appState.sourceBText,
            appState.sourceAFile,
            appState.sourceBFile,
            appState.reparamSigma,
            appState.textEmbedType
        );
    };

    return (
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
    );
}
