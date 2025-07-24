/** @type {import('lint-staged').Config} */
module.exports = {
  '*.{ts,tsx,js,jsx,vue}': ['eslint --fix', 'prettier --write'],
}
