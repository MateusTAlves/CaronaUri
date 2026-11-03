import { Platform } from 'react-native';

let MapView: any;
let Marker: any;
let PROVIDER_DEFAULT: any;

if (Platform.OS === 'web') {
  const shim = require('./MapViewShim');
  MapView = shim.default;
  Marker = shim.Marker;
  PROVIDER_DEFAULT = shim.PROVIDER_DEFAULT;
} else {
  try {
    // Require react-native-maps at runtime for native platforms.
    // This avoids bundling native modules into web builds.
    const maps = require('react-native-maps');
    MapView = maps.default ?? maps;
    Marker = maps.Marker;
    PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
  } catch (err) {
    // Fallback to shim if react-native-maps isn't available
    const shim = require('./MapViewShim');
    MapView = shim.default;
    Marker = shim.Marker;
    PROVIDER_DEFAULT = shim.PROVIDER_DEFAULT;
  }
}

export default MapView;
export { Marker, PROVIDER_DEFAULT };
