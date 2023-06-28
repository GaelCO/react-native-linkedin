import React from 'react';
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

interface State {
  access_token?: string
  expires_in?: number
  refreshing: boolean
  localizedFirstName?: string
  message?: string
}
export default class AppContainer extends React.Component<{}, State> {
  state = {
    access_token: undefined,
    expires_in: undefined,
    refreshing: false,
    localizedFirstName: undefined,
    message: undefined,
  }

  modal = React.createRef<LinkedInModal>()

  constructor(props: any) {
    super(props)
    StatusBar.setHidden(true)
  }

  getUser = async (data: LinkedInToken) => {
    const {access_token, authentication_code} = data;
    if (!authentication_code) {
      this.setState({refreshing: true});

      const response = await fetch('https://api.linkedin.com/v2/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
      });
      const payload = await response.json();
      this.setState({...payload, refreshing: false});
    } else {
      alert(`authentication_code = ${authentication_code}`);
    }
  }

  renderItem(label: string, value: string) {
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
    ) : null;
  }

  signOut = () => {
    this.setState({refreshing: true});
    this.modal.current
      ?.logoutAsync()
      .then(() =>
        this.setState({ localizedFirstName: undefined, refreshing: false }),
      );
  }

  render() {
    const {refreshing, localizedFirstName} = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.linkedInContainer}>
          <LinkedInModal
            ref={this.modal}
            clientID={CLIENT_ID}
            clientSecret={CLIENT_SECRET}
            redirectUri={REDIRECT_URL}
            onSuccess={this.getUser}
          />
          <Button
            title="Open from external"
            onPress={() => this.modal.current?.open()}
          />
        </View>

        {refreshing && <ActivityIndicator size="large" />}

        {localizedFirstName && (
          <>
            <View style={styles.userContainer}>
              {this.renderItem('Last name', localizedFirstName)}
            </View>
            <Button title="Log Out" onPress={this.signOut} />
          </>
        )}
      </View>
    );
  }
}
