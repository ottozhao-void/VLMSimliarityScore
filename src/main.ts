import { createIcons, icons } from 'lucide';
import Chart from 'chart.js/auto';

// Initialize Icons
createIcons({ icons });

// State
let currentModelId = '';
let useGpu = true;
let isModelLoaded = false;
let selectedImage: File | null = null;
let selectedVideo: File | null = null;
let chartInstance: Chart | null = null;

// Elements
const modelPreset = document.getElementById('model-preset') as HTMLSelectElement;
const customModelInput = document.getElementById('custom-model-input') as HTMLDivElement;
const customModelIdField = document.getElementById('model-id') as HTMLInputElement;
const loadModelBtn = document.getElementById('load-model-btn') as HTMLButtonElement;
const statusContainer = document.getElementById('status-container') as HTMLDivElement;

const gpuToggle = document.getElementById('gpu-toggle') as HTMLButtonElement;
const gpuToggleKnob = document.getElementById('gpu-toggle-knob') as HTMLSpanElement;
const gpuIconContainer = document.getElementById('gpu-icon-container') as HTMLDivElement;
const gpuIcon = document.getElementById('gpu-icon') as HTMLElement;
const gpuText = document.getElementById('gpu-text') as HTMLSpanElement;

const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const dropZoneContainer = document.getElementById('drop-zone-container') as HTMLDivElement;
const imageRandomPlaceholder = document.getElementById('image-random-placeholder') as HTMLDivElement;

const imageInput = document.getElementById('image-input') as HTMLInputElement;
const dropPlaceholder = document.getElementById('drop-placeholder') as HTMLDivElement;
const imagePreview = document.getElementById('image-preview') as HTMLImageElement;
const clearImageBtn = document.getElementById('clear-image-btn') as HTMLButtonElement;

const videoDropZone = document.getElementById('video-drop-zone') as HTMLDivElement;
const videoDropZoneContainer = document.getElementById('video-drop-zone-container') as HTMLDivElement;
const videoInput = document.getElementById('video-input') as HTMLInputElement;
const videoDropPlaceholder = document.getElementById('video-drop-placeholder') as HTMLDivElement;
const videoPreview = document.getElementById('video-preview') as HTMLVideoElement;
const clearVideoBtn = document.getElementById('clear-video-btn') as HTMLButtonElement;

const textInput = document.getElementById('text-input') as HTMLTextAreaElement;
const textInputContainer = document.getElementById('text-input-container') as HTMLDivElement;
const textRandomPlaceholder = document.getElementById('text-random-placeholder') as HTMLDivElement;

const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;

// Tab Handling
const tabSource = document.getElementById('tab-source') as HTMLButtonElement;
const tabGeneral = document.getElementById('tab-general') as HTMLButtonElement;
const contentSource = document.getElementById('content-source') as HTMLDivElement;
const contentGeneral = document.getElementById('content-general') as HTMLDivElement;

function switchTab(tab: 'source' | 'general') {
    if (tab === 'source') {
        tabSource.classList.replace('text-gray-500', 'bg-white');
        tabSource.classList.add('text-gray-900', 'shadow-sm');
        tabSource.classList.remove('hover:text-gray-900');

        tabGeneral.classList.replace('bg-white', 'text-gray-500');
        tabGeneral.classList.remove('text-gray-900', 'shadow-sm');
        tabGeneral.classList.add('hover:text-gray-900');

        contentSource.classList.remove('hidden');
        contentGeneral.classList.add('hidden');
    } else {
        tabGeneral.classList.replace('text-gray-500', 'bg-white');
        tabGeneral.classList.add('text-gray-900', 'shadow-sm');
        tabGeneral.classList.remove('hover:text-gray-900');

        tabSource.classList.replace('bg-white', 'text-gray-500');
        tabSource.classList.remove('text-gray-900', 'shadow-sm');
        tabSource.classList.add('hover:text-gray-900');

        contentGeneral.classList.remove('hidden');
        contentSource.classList.add('hidden');
    }
}

tabSource.addEventListener('click', () => switchTab('source'));
tabGeneral.addEventListener('click', () => switchTab('general'));

const imageSourceSelect = document.getElementById('image-source') as HTMLSelectElement;
const textSourceSelect = document.getElementById('text-source') as HTMLSelectElement;

const resultsSection = document.getElementById('results-section') as HTMLDivElement;
const scoreValue = document.getElementById('score-value') as HTMLSpanElement;
const angleValue = document.getElementById('angle-value') as HTMLSpanElement;
const timeValue = document.getElementById('time-value') as HTMLSpanElement;
const modelUsedValue = document.getElementById('model-used-value') as HTMLSpanElement;

// UI Helpers
function setStatus(type: 'loading' | 'ready' | 'error', message?: string) {
    let html = '';
    if (type === 'loading') {
        html = `
            <div class="space-y-2 animate-pulse">
                <div class="flex justify-between text-xs text-gray-600">
                    <span>Loading Model...</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-black h-full w-2/3 animate-[shimmer_1s_infinite]"></div>
                </div>
            </div>`;
    } else if (type === 'ready') {
        html = `
            <div class="flex items-center gap-2 text-green-700 text-sm bg-green-50 p-3 rounded-md border border-green-100 fade-in">
                <i data-lucide="check-circle-2" width="16" height="16"></i>
                <span>Model loaded & ready.</span>
            </div>`;
    } else if (type === 'error') {
        html = `
            <div class="flex items-start gap-2 text-red-700 text-sm bg-red-50 p-3 rounded-md border border-red-100 fade-in">
                <i data-lucide="alert-circle" width="16" height="16" class="mt-0.5 shrink-0"></i>
                <span class="leading-snug break-words">${message}</span>
            </div>`;
    }
    statusContainer.innerHTML = html;
    createIcons({ icons, nameAttr: 'data-lucide', attrs: { width: "16", height: "16" } });
}

function updateCalculateButton() {
    const hasText = textSourceSelect.value === 'Random' || textInput.value.trim().length > 0;
    let hasMedia = false;

    if (imageSourceSelect.value === 'Image') hasMedia = selectedImage !== null;
    else if (imageSourceSelect.value === 'Video') hasMedia = selectedVideo !== null;
    else if (imageSourceSelect.value === 'Random') hasMedia = true;

    const ready = isModelLoaded && hasText && hasMedia;

    if (ready) {
        calculateBtn.disabled = false;
        calculateBtn.classList.remove('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
        calculateBtn.classList.add('bg-black', 'text-white', 'hover:bg-gray-800', 'hover:shadow-xl', 'active:scale-95');
    } else {
        calculateBtn.disabled = true;
        calculateBtn.classList.add('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
        calculateBtn.classList.remove('bg-black', 'text-white', 'hover:bg-gray-800', 'hover:shadow-xl', 'active:scale-95');
    }
}

// Event Listeners

// Source Selectors
imageSourceSelect.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    if (val === 'Random') {
        dropZoneContainer.classList.add('hidden');
        videoDropZoneContainer.classList.add('hidden');
        imageRandomPlaceholder.classList.remove('hidden');
    } else if (val === 'Video') {
        dropZoneContainer.classList.add('hidden');
        videoDropZoneContainer.classList.remove('hidden');
        imageRandomPlaceholder.classList.add('hidden');
    } else {
        dropZoneContainer.classList.remove('hidden');
        videoDropZoneContainer.classList.add('hidden');
        imageRandomPlaceholder.classList.add('hidden');
    }
    updateCalculateButton();
});

textSourceSelect.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    if (val === 'Random') {
        textInputContainer.classList.add('hidden');
        textRandomPlaceholder.classList.remove('hidden');
    } else {
        textInputContainer.classList.remove('hidden');
        textRandomPlaceholder.classList.add('hidden');
    }
    updateCalculateButton();
});

modelPreset.addEventListener('change', (e) => {
    if ((e.target as HTMLSelectElement).value === 'custom') {
        customModelInput.classList.remove('hidden');
    } else {
        customModelInput.classList.add('hidden');
    }
});

gpuToggle.addEventListener('click', () => {
    useGpu = !useGpu;
    if (useGpu) {
        gpuToggle.classList.replace('bg-gray-200', 'bg-black');
        gpuToggleKnob.classList.replace('translate-x-0', 'translate-x-5');
        gpuIconContainer.classList.replace('bg-gray-100', 'bg-purple-100');
        gpuIconContainer.classList.replace('text-gray-500', 'text-purple-700');
        gpuIcon.setAttribute('data-lucide', 'zap');
        gpuText.innerText = 'Server GPU (CUDA)';
    } else {
        gpuToggle.classList.replace('bg-black', 'bg-gray-200');
        gpuToggleKnob.classList.replace('translate-x-5', 'translate-x-0');
        gpuIconContainer.classList.replace('bg-purple-100', 'bg-gray-100');
        gpuIconContainer.classList.replace('text-purple-700', 'text-gray-500');
        gpuIcon.setAttribute('data-lucide', 'cpu');
        gpuText.innerText = 'CPU Mode';
    }
    createIcons({ icons });
});

loadModelBtn.addEventListener('click', async () => {
    const preset = modelPreset.value;
    const modelId = preset === 'custom' ? customModelIdField.value : preset;

    if (!modelId) return;

    setStatus('loading');
    loadModelBtn.disabled = true;
    loadModelBtn.innerHTML = '<span>Loading...</span>';

    try {
        const res = await fetch('/api/load_model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_id: modelId, use_gpu: useGpu })
        });

        if (!res.ok) {
            const err = await res.json();
            throw err;
        }

        setStatus('ready');
        isModelLoaded = true;
        currentModelId = modelId;
        updateCalculateButton();
    } catch (err: any) {
        console.error(err);
        setStatus('error', err.detail || 'Failed to load model');
    } finally {
        loadModelBtn.disabled = false;
        loadModelBtn.innerHTML = '<i data-lucide="download" width="16" height="16"></i><span>Load Model</span>';
        createIcons({ icons });
    }
});

// Image Handling
function handleFile(file: File) {
    if (!file || !file.type.startsWith('image/')) return;
    selectedImage = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target!.result as string;
        imagePreview.classList.remove('hidden');
        dropPlaceholder.classList.add('hidden');
        dropZone.classList.add('border-gray-200', 'bg-gray-50');
        dropZone.classList.remove('hover:border-black', 'hover:bg-gray-100', 'cursor-pointer');
        clearImageBtn.classList.remove('hidden');
        updateCalculateButton();
    };
    reader.readAsDataURL(file);
}

dropZone.addEventListener('click', () => {
    if (!selectedImage) imageInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-black', 'bg-gray-100');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-black', 'bg-gray-100');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-black', 'bg-gray-100');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

imageInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
        handleFile(files[0]);
    }
});

clearImageBtn.addEventListener('click', () => {
    selectedImage = null;
    imageInput.value = '';
    imagePreview.classList.add('hidden');
    dropPlaceholder.classList.remove('hidden');
    clearImageBtn.classList.add('hidden');

    // Reset styles
    dropZone.classList.remove('border-gray-200', 'bg-gray-50');
    dropZone.classList.add('border-gray-300', 'hover:border-black', 'bg-gray-50', 'hover:bg-gray-100', 'cursor-pointer');

    updateCalculateButton();
});

// Video Handling
function handleVideoFile(file: File) {
    if (!file || !file.type.startsWith('video/')) return;
    selectedVideo = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        videoPreview.src = e.target!.result as string;
        videoPreview.classList.remove('hidden');
        videoDropPlaceholder.classList.add('hidden');
        videoDropZone.classList.add('border-gray-200', 'bg-gray-50');
        videoDropZone.classList.remove('hover:border-black', 'hover:bg-gray-100', 'cursor-pointer');
        clearVideoBtn.classList.remove('hidden');
        updateCalculateButton();
    };
    reader.readAsDataURL(file);
}

videoDropZone.addEventListener('click', () => {
    if (!selectedVideo) videoInput.click();
});

videoDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    videoDropZone.classList.add('border-black', 'bg-gray-100');
});

videoDropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    videoDropZone.classList.remove('border-black', 'bg-gray-100');
});

videoDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    videoDropZone.classList.remove('border-black', 'bg-gray-100');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleVideoFile(e.dataTransfer.files[0]);
    }
});

videoInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
        handleVideoFile(files[0]);
    }
});

clearVideoBtn.addEventListener('click', () => {
    selectedVideo = null;
    videoInput.value = '';
    videoPreview.pause();
    videoPreview.src = '';
    videoPreview.classList.add('hidden');
    videoDropPlaceholder.classList.remove('hidden');
    clearVideoBtn.classList.add('hidden');

    // Reset styles
    videoDropZone.classList.remove('border-gray-200', 'bg-gray-50');
    videoDropZone.classList.add('border-gray-300', 'hover:border-black', 'bg-gray-50', 'hover:bg-gray-100', 'cursor-pointer');

    updateCalculateButton();
});

textInput.addEventListener('input', updateCalculateButton);

// Calculation
calculateBtn.addEventListener('click', async () => {
    if (!selectedImage && imageSourceSelect.value === 'Image') return;
    if (!textInput.value && textSourceSelect.value === 'Text') return;

    calculateBtn.disabled = true;
    calculateBtn.innerHTML = `
        <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Computing...</span>`;

    const formData = new FormData();
    formData.append('image_source', imageSourceSelect.value);
    formData.append('text_source', textSourceSelect.value);

    if (imageSourceSelect.value === 'Image' && selectedImage) {
        formData.append('image', selectedImage);
    } else if (imageSourceSelect.value === 'Video' && selectedVideo) {
        formData.append('video', selectedVideo);
    }

    if (textSourceSelect.value === 'Text') {
        formData.append('text', textInput.value);
    }

    try {
        const res = await fetch('/api/predict', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw errorData;
        }

        const data = await res.json();

        if (data.type === 'video') {
            // Video Results
            scoreValue.innerText = data.average_score.toFixed(4);
            angleValue.innerText = '-'; // Average angle? or just hide it
            timeValue.innerText = data.time.toFixed(0) + ' ms';
            modelUsedValue.innerText = currentModelId;

            document.getElementById('chart-container')!.classList.remove('hidden');
            resultsSection.classList.remove('hidden');

            // Render Chart
            const ctx = (document.getElementById('similarity-chart') as HTMLCanvasElement).getContext('2d');

            if (chartInstance) {
                chartInstance.destroy();
            }

            const labels = data.frames.map((f: any) => f.time.toFixed(1) + 's');
            const scores = data.frames.map((f: any) => f.score);

            if (ctx) {
                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Similarity Score',
                            data: scores,
                            borderColor: 'rgb(0, 0, 0)',
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            tension: 0.3,
                            fill: true,
                            pointRadius: 2,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        return `Score: ${context.parsed.y.toFixed(4)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                suggestedMin: -0.1,
                                suggestedMax: 1.0,
                                title: {
                                    display: true,
                                    text: 'Similarity'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Time (s)'
                                }
                            }
                        },
                        onClick: (e, elements) => {
                            if (elements.length > 0) {
                                const index = elements[0].index;
                                const time = data.frames[index].time;
                                videoPreview.currentTime = time;
                                videoPreview.play();
                            }
                        }
                    }
                });
            }

        } else {
            // Image Results
            scoreValue.innerText = data.score.toFixed(4);
            if (data.angle !== undefined) {
                angleValue.innerText = data.angle.toFixed(2);
            }
            timeValue.innerText = data.time.toFixed(0) + ' ms';
            modelUsedValue.innerText = currentModelId;
            document.getElementById('chart-container')!.classList.add('hidden');
            resultsSection.classList.remove('hidden');
        }

    } catch (err: any) {
        console.error(err);
        alert('Error computing similarity: ' + (err.detail || err.toString()));
    } finally {
        calculateBtn.disabled = false;
        calculateBtn.innerHTML = `
            <i data-lucide="play" width="20" height="20" fill="currentColor"></i>
            <span>Calculate Similarity</span>`;
        createIcons({ icons });
    }
});
