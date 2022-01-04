// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

module.exports = (async () => {
    const {
      resolver: {sourceExts, assetExts},
    } = await getDefaultConfig(__dirname);
    return {
      resolver: {
        assetExts: [...assetExts, 'png', 'jpg'],
        sourceExts: [...sourceExts, 'png', 'jpg'],
      },
    };
})();

module.exports = defaultConfig;