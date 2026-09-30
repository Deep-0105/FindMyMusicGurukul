module.exports = {
  secret: process.env.JWT_SECRET || 'FindMyMusicGurukulSuperSecretJwtKey2026',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
};
