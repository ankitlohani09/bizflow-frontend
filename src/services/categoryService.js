import api from './api';

const categoryService = {
    getAll() {
        return api.get('/categories');
    },
    create(data) {
        return api.post('/categories', data);
    }
};

export default categoryService;
