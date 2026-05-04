import api from './api';

const unitService = {
    getAll() {
        return api.get('/units');
    },
    create(data) {
        return api.post('/units', data);
    }
};

export default unitService;
