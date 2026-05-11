import api from './api';

const userService = {
    updateProfilePicture: async (userId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return api.post(`/users/${userId}/profile-picture`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deleteProfilePicture: async (userId) => {
        return api.delete(`/users/${userId}/profile-picture`);
    },

    getProfile: async (userId) => {
        return api.get(`/users/${userId}`);
    },

    updateProfile: async (userId, data) => {
        return api.put(`/users/${userId}`, data);
    }
};

export default userService;
