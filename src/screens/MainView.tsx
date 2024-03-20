import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  Text,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Mapbox from '@rnmapbox/maps';
import Geolocation from '@react-native-community/geolocation';
import {LocationIcon} from '../assets/icons/LocationIcon';
import {Feature, GeoJsonProperties, Geometry} from 'geojson';
import {Bicycle} from '../assets/icons/Bicycle';

const {width: screenWidth} = Dimensions.get('screen');

const APIKEY =
  'pk.eyJ1IjoidHVhbm50aHplbi1zIiwiYSI6ImNsdHh0enBidDBhbTEyaG8wbHpwYnZ6b2MifQ.Fe_p8lBa_pECjhR2bQ4LFg';
Mapbox.setAccessToken(APIKEY);
// Mapbox.setConnected(true);
Mapbox.setTelemetryEnabled(false);
// Mapbox.setWellKnownTileServer('Mapbox');

const MainView = () => {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({latitude: '', longitude: ''});
  const [pointWayList, setPointWayList] = useState<[number, number][]>([]);
  const [selectLocation, setSelectLocation] = useState<[number, number]>();
  const [routeDirection, setRouteDirection] = useState<any | null>();
  const [routeDirection2, setRouteDirection2] = useState<any | null>();
  const [distance, setDistance] = useState<string | number>();
  const [distance2, setDistance2] = useState<string | number>();
  const [duration, setDuration] = useState<string | number>();
  const [duration2, setDuration2] = useState<string | number>();
  const [bearing, setBearing] = useState<number>();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    routeDirection && handleFindHeadingAngle();
  }, [routeDirection]);

  // useEffect(() => {
  //   if (location?.latitude && location?.longitude && routeDirection) {
  //     setRouteDirection(prev => ({
  //       ...prev,
  //       features: [
  //         {
  //           ...prev?.features?.[0],
  //           geometry: {
  //             ...prev?.features?.[0]?.geometry,
  //             coordinates: prev?.features?.[0]?.geometry?.coordinates?.slice(
  //               1,
  //               prev?.feature?.geometry?.coordinates?.length,
  //             ),
  //           },
  //         },
  //       ],
  //     }));
  //   }
  // }, [location]);
  // console.log(routeDirection?.features?.[0]?.geometry);

  const getCurrentLocation = () => {
    Geolocation.watchPosition(
      position => {
        console.log(position?.coords);
        setLocation(position?.coords);
        setPointWayList(prev => [
          ...prev,
          [
            Number(position?.coords?.longitude),
            Number(position?.coords?.latitude),
          ],
        ]);
        setLoading(false);
      },
      () => {
        setLoading(false);
        Alert.alert('Error', 'Error in getCurrentLocation');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 5,
      },
    );
  };

  const makeRouterFeature = (coordinates: [number, number][]) => ({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
      },
    ],
  });

  const createRouterLine = async (
    coords: [number, number],
    routeProfile: string,
  ) => {
    let allCoords = pointWayList.reduce(
      (totalString, current, index, array) =>
        (totalString =
          totalString +
          `${current?.[0]},${current?.[1]}${
            array.length - 1 === index ? '' : ';'
          }`),
      '',
    );
    allCoords = `${allCoords};${coords[0]},${coords[1]}`;
    const geometries = 'geojson';
    const url = `https://api.mapbox.com/directions/v5/mapbox/${routeProfile}/${allCoords}?alternatives=true&geometries=${geometries}&steps=true&banner_instructions=true&overview=full&voice_instructions=true&access_token=${APIKEY}`;
    try {
      let response = await fetch(url);
      let json = await response.json();

      json.routes.forEach((data: any, index: number) => {
        if (index > 0) {
          setDistance2((data.distance / 1000).toFixed(2));
          setDuration2((data.duration / 3600).toFixed(2));
        } else {
          setDistance((data.distance / 1000).toFixed(2));
          setDuration((data.duration / 3600).toFixed(2));
        }
      });

      let coordinates1 = json?.routes?.[0]?.geometry?.coordinates;
      let coordinates2 = json?.routes?.[1]?.geometry?.coordinates;

      if (coordinates1.length) {
        const routerFeature = makeRouterFeature([...coordinates1]);
        setRouteDirection(routerFeature);
      }
      if (coordinates2?.length) {
        const routerFeature = makeRouterFeature([...coordinates2]);
        setRouteDirection2(routerFeature);
      }
      // setLoading(false);
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e?.[0]);
    }
  };

  const handleGetDirection = async (
    locationSelected: Feature<Geometry, GeoJsonProperties>,
  ) => {
    setRouteDirection(null);
    setRouteDirection2(null);
    setSelectLocation(locationSelected?.geometry?.coordinates);
    setPointWayList(prev => [...prev, locationSelected?.geometry?.coordinates]);
    await createRouterLine(locationSelected?.geometry?.coordinates, 'cycling');
  };

  const toRadians = (degrees: number) => {
    return degrees * (Math.PI / 180);
  };

  const toDegrees = (radians: number) => {
    return radians * (180 / Math.PI);
  };

  const bearingAngle = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const deltaLon = toRadians(lon2 - lon1);

    const y = Math.sin(deltaLon) * Math.cos(toRadians(lat2));
    const x =
      Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
      Math.sin(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.cos(deltaLon);

    let theta = Math.atan2(y, x);

    let bearing = toDegrees(theta);

    // Đảm bảo góc nằm trong khoảng 0-360 độ
    if (bearing < 0) {
      bearing += 360;
    }

    return bearing;
  };

  const handleFindHeadingAngle = () => {
    // console.log(
    //   Number(location?.latitude),
    //   Number(location?.longitude),
    //   routeDirection?.features?.[0]?.geometry?.coordinates?.[0]?.[1],
    //   routeDirection?.features?.[0]?.geometry?.coordinates?.[0]?.[0],
    // );
    let bearing = bearingAngle(
      Number(location?.latitude),
      Number(location?.longitude),
      routeDirection?.features?.[0]?.geometry?.coordinates?.[0]?.[1],
      routeDirection?.features?.[0]?.geometry?.coordinates?.[0]?.[0],
    );
    setBearing(bearing);
  };

  return loading ? (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size={'large'} color={'#333'} />
    </View>
  ) : (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        zoomEnabled
        styleURL="mapbox://styles/mapbox/streets-v12"
        rotateEnabled
        onPress={feature => handleGetDirection(feature)}>
        <Mapbox.Camera
          zoomLevel={17}
          centerCoordinate={
            selectLocation || [
              Number(location?.longitude),
              Number(location?.latitude),
            ]
          }
          pitch={0}
          animationMode="flyTo"
          animationDuration={6000}
        />
        {routeDirection && (
          <Mapbox.ShapeSource id="line1" shape={routeDirection}>
            <Mapbox.LineLayer
              id="routerLine01"
              style={{
                lineColor: 'blue',
                lineWidth: 4,
              }}
            />
          </Mapbox.ShapeSource>
        )}
        {routeDirection2 && (
          <Mapbox.ShapeSource id="line2" shape={routeDirection2}>
            <Mapbox.LineLayer
              id="routerLine02"
              style={{
                lineColor: 'rgba(0,0,255, .3)',
                lineWidth: 4,
              }}
            />
          </Mapbox.ShapeSource>
        )}
        {pointWayList.length > 1 &&
          pointWayList.map(
            (item, index, array) =>
              JSON.stringify(item) !==
                JSON.stringify([
                  Number(location?.longitude),
                  Number(location?.latitude),
                ]) && (
                <Mapbox.PointAnnotation
                  key={String(index)}
                  id={`destinationPoint${index}`}
                  coordinate={item as [number, number]}>
                  <View style={styles.destinationIcon}>
                    <LocationIcon
                      fill={array.length - 1 === index ? 'red' : '#8F9BB3'}
                    />
                  </View>
                </Mapbox.PointAnnotation>
              ),
          )}
        {location?.latitude && location?.longitude && (
          <Mapbox.MarkerView
            id="marker"
            coordinate={[
              Number(location?.longitude),
              Number(location?.latitude),
            ]}>
            <View
              style={[
                styles.destinationIcon,
                {
                  transform: [
                    // {rotate: `${bearing ? bearing.
                    //    : 0}deg`},
                    {rotateX: '0deg'},
                    {rotateY: '180deg'},
                    {rotateZ: '60deg'},
                  ],
                },
              ]}>
              <Bicycle />
            </View>
          </Mapbox.MarkerView>
        )}
      </Mapbox.MapView>
      {selectLocation && (
        <View style={styles.cardCoord}>
          <View
            style={{
              backgroundColor: 'white',
              width: screenWidth,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              shadowColor: 'black',
              elevation: 20,
              padding: 20,
            }}>
            {routeDirection && (
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Text style={{fontSize: 18, color: '#000'}}>Route 1:</Text>
                <Text style={{fontSize: 18, color: '#000'}}>
                  {(Number(duration) * 60).toFixed(1)} minutes
                </Text>
                <Text style={{fontSize: 18, color: '#666'}}>
                  ({distance} km)
                </Text>
              </View>
            )}
            {routeDirection2 && (
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Text style={{fontSize: 18, color: '#000'}}>Route 2:</Text>
                <Text style={{fontSize: 18, color: '#000'}}>
                  {(Number(duration2) * 60).toFixed(1)} minutes
                </Text>
                <Text style={{fontSize: 18, color: '#666'}}>
                  ({distance2} km)
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  destinationIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCoord: {
    position: 'absolute',
    zIndex: 1,
    bottom: 0,
  },
});

export default MainView;
