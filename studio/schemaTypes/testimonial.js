export default {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Person name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'roleDa',
      title: 'Role (Danish)',
      type: 'string',
      description: 'e.g. "Ejer af Sams Indeklima"',
    },
    {
      name: 'roleEn',
      title: 'Role (English)',
      type: 'string',
      description: 'e.g. "Owner of Sams Indeklima"',
    },
    {
      name: 'quoteDa',
      title: 'Quote (Danish)',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'quoteEn',
      title: 'Quote (English)',
      type: 'text',
      rows: 5,
      description: 'Leave empty to reuse the Danish quote on the English site',
    },
    {
      name: 'photo',
      title: 'Photo (optional)',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'featured',
      title: 'Show on homepage',
      type: 'boolean',
      description: 'Tick to display in the homepage testimonial row',
      initialValue: true,
    },
    {
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers show first (e.g. 1, 2, 3)',
      initialValue: 10,
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'roleDa', media: 'photo' },
  },
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
}
