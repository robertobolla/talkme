export default {
  async find(ctx) {
    const reviews = await strapi.entityService.findMany('api::review.review', {
      populate: '*'
    });
    return { data: reviews };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const review = await strapi.entityService.findOne('api::review.review', id, {
      populate: '*'
    });
    return { data: review };
  },

  async create(ctx) {
    const { data } = ctx.request.body;
    const review = await strapi.entityService.create('api::review.review', {
      data
    });
    return { data: review };
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;
    const review = await strapi.entityService.update('api::review.review', id, {
      data
    });
    return { data: review };
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const review = await strapi.entityService.delete('api::review.review', id);
    return { data: review };
  }
}; 