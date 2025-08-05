export default {
  async find(params) {
    return await strapi.entityService.findMany('api::review.review', params);
  },

  async findOne(id, params) {
    return await strapi.entityService.findOne('api::review.review', id, params);
  },

  async create(data) {
    return await strapi.entityService.create('api::review.review', { data });
  },

  async update(id, data) {
    return await strapi.entityService.update('api::review.review', id, { data });
  },

  async delete(id) {
    return await strapi.entityService.delete('api::review.review', id);
  }
}; 