import api from './api';

const brandingService = {
    getSettings: async () => {
        const response = await api.get('/white-label/settings');
        return response;
    },

    updateSettings: async (settings) => {
        const response = await api.put('/white-label/settings', settings);
        return response;
    },

    uploadLogo: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/white-label/settings/logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    },

    deleteLogo: async () => {
        const response = await api.delete('/white-label/settings/logo');
        return response;
    }
};

export default brandingService;
