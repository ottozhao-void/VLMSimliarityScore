
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { useAppState } from './hooks/useAppState';
import { useModel } from './hooks/useModel';
import { usePrediction } from './hooks/usePrediction';

export default function App() {
    const appState = useAppState();
    const { status: modelStatus, message: modelMsg, loadModel } = useModel();
    const { calculating, results, predict } = usePrediction();

    const handleLoadModel = () => {
        const id = appState.modelPreset === 'custom' ? appState.customModelId : appState.modelPreset;
        loadModel(id, appState.useGpu);
    };

    const handleCalculate = () => {
        predict(
            appState.imageSource,
            appState.textSource,
            appState.textInput,
            appState.selectedImage,
            appState.selectedVideo
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
