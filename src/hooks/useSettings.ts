import { useState, useCallback, useEffect } from 'react';

interface PathSettings {
    datasetPath: string;
    videoPath: string;
}

interface UseSettingsResult {
    settings: PathSettings;
    loading: boolean;
    saving: boolean;
    error: string | null;
    validationErrors: string[];
    fetchSettings: () => Promise<void>;
    saveSettings: (datasetPath: string, videoPath: string) => Promise<boolean>;
}

/**
 * Hook for managing QVHighlights path settings.
 * Handles fetching current settings and validating/saving new paths.
 */
export function useSettings(): UseSettingsResult {
    const [settings, setSettings] = useState<PathSettings>({
        datasetPath: '/data1/zhaofanghan/vmr_dataset/data/qvhighlights',
        videoPath: '/data1/zhaofanghan/vmr_dataset/qvhilights_videos'
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/settings/paths');

            if (!res.ok) {
                throw new Error('Failed to fetch settings');
            }

            const data = await res.json();

            if (data.datasetPath && data.videoPath) {
                setSettings({
                    datasetPath: data.datasetPath,
                    videoPath: data.videoPath
                });
            }
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSettings = useCallback(async (datasetPath: string, videoPath: string): Promise<boolean> => {
        setSaving(true);
        setError(null);
        setValidationErrors([]);

        try {
            const res = await fetch('/api/settings/paths', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ datasetPath, videoPath })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || 'Failed to save settings');
            }

            if (data.valid) {
                setSettings({ datasetPath, videoPath });
                return true;
            } else {
                setValidationErrors(data.errors || ['Validation failed']);
                return false;
            }
        } catch (err: any) {
            setError(err.message || String(err));
            return false;
        } finally {
            setSaving(false);
        }
    }, []);

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return {
        settings,
        loading,
        saving,
        error,
        validationErrors,
        fetchSettings,
        saveSettings
    };
}
