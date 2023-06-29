import React, {ReactElement, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import {CLIENT_ID, CLIENT_SECRET, REDIRECT_URL} from './config';

import LinkedInModal, {LinkedInToken} from './src/';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  picture: {
    width: 200,
    height: 200,
    borderRadius: 100,
    resizeMode: 'cover',
    marginBottom: 15,
  },
  item: {
    width: '100%',
    flexDirection: 'row',
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginRight: 10,
  },
  value: {
    fontWeight: 'bold',
    marginLeft: 10,
  },
  linkedInContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    alignItems: 'flex-end',
  },
  valueContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});

export default function AppContainer(): ReactElement {
  const [, setAccessToken] = useState<string | undefined>();
  const [, setExpiresIn] = useState<any | undefined>();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [localizedFirstName, setLocalizedFirstName] = useState<string>();
  const [, setMessage] = useState<string | undefined>();

  const modal = useRef<any>();

  useEffect(() => {
    StatusBar.setHidden(true);
  }, []);

  const getUser = async (data: LinkedInToken) => {
    const {access_token, authentication_code} = data;
    if (!authentication_code) {
      setRefreshing(true);

      const response = await fetch('https://api.linkedin.com/v2/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
      });
      const payload = await response.json();
      setAccessToken(payload.access_token);
      setExpiresIn(payload?.expires_in);
      setLocalizedFirstName(payload?.localizedFirstName);
      setMessage(payload?.message);
      setRefreshing(false);
    } else {
      alert(`authentication_code = ${authentication_code}`);
    }
  };

  const renderItem = (label: string, value: string): ReactElement => {
    return value ? (
      <View style={styles.item}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text>👉</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    ) : (
      <></>
    );
  };

  const signOut = () => {
    setRefreshing(true);
    modal.current?.logoutAsync().then(() => {
      setLocalizedFirstName(undefined);
      setRefreshing(false);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.linkedInContainer}>
        <LinkedInModal
          ref={modal}
          clientID={CLIENT_ID}
          clientSecret={CLIENT_SECRET}
          redirectUri={REDIRECT_URL}
          onSuccess={getUser}
        />
        <Button
          title="Open from external"
          onPress={() => {
            modal.current?.open();
          }}
        />
      </View>

      {refreshing && <ActivityIndicator size="large" />}

      {localizedFirstName && (
        <>
          <View style={styles.userContainer}>
            {renderItem('Last name', localizedFirstName)}
          </View>
          <Button title="Log Out" onPress={signOut} />
        </>
      )}
    </View>
  );
}
