export const mapId = (row) => {
  if (!row) return row;
  const { id, created_at, updated_at, ...rest } = row;
  return {
    _id: id,
    createdAt: created_at,
    updatedAt: updated_at,
    ...rest,
  };
};

export const mapIds = (rows = []) => rows.map(mapId);

export const userPublicFields = (user) => ({
  id: user.id,
  _id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  company: user.company,
});
