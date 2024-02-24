const { nanoid } = require('nanoid')
const { File } = require('./model')

async function createSlug() {
  const slug = nanoid(8);

  if (
    ['-', '_'].includes(slug[0]) ||
    ['-', '_'].includes(slug[slug.length - 1])
  ) {
    return createSlug();
  }

  const exists = await File.exists({ slug });
  if (exists) {
    return createSlug();
  }

  return slug;
}

const services = {
  CreateFile: async (req, res) => {
    const { mime_type, original_name, name, size, headers } = req.request
    const slug = await createSlug()

    const file = new File({
      name,
      original_name,
      mime_type,
      size,
      slug,
      headers,
    })

    const _file = await file.save()
    res(null, _file)
  },
  CreateFilePart: async (req, res) => {
    const { _id, part } = req.request
    const { owner, name, offset, size, id } = part

    const result = await File.updateOne(
      { _id },
      { $push: { parts: { owner, name, offset, size, id } } },
    );

    res(null, { value: result.modifiedCount })
  },
  SetLoading: async (req, res) => {
    const { _id, loading_from_cloud_now } = req.request

    const result = await File.updateOne({ _id }, { loading_from_cloud_now });

    res(null, { value: result.modifiedCount })
  },
  GetBySlug: async (req, res) => {
    const { slug } = req.request

    const result = await File.findOne({ slug })

    res(null, result)
  },
}

module.exports = {
  services
}