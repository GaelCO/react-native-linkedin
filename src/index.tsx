import React, {ReactNode} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Modal,
  StyleSheet,
  Image,
} from 'react-native';
import {ViewPropTypes} from 'deprecated-react-native-prop-types';
import {WebView} from 'react-native-webview';
import PropTypes from 'prop-types';
import {pipe, evolve, propSatisfies, applySpec, propOr, add} from 'ramda';
import 'react-native-get-random-values';
import {v4} from 'uuid';
import querystring from 'query-string';

const AUTHORIZATION_URL: string =
  'https://www.linkedin.com/oauth/v2/authorization'
const ACCESS_TOKEN_URL: string = 'https://www.linkedin.com/oauth/v2/accessToken'
const LOGOUT_URL: string = 'https://www.linkedin.com/m/logout'

export interface LinkedInToken {
  authentication_code?: string
  access_token?: string
  expires_in?: number
}

export interface ErrorType {
  type?: string
  message?: string
}

interface State {
  raceCondition: boolean
  modalVisible: boolean
  authState: string
  logout: boolean
}

interface Props {
  clientID: string
  clientSecret?: string
  redirectUri: string
  authState?: string
  permissions: string[]
  linkText?: string
  containerStyle?: any
  wrapperStyle?: any
  closeStyle?: any
  animationType?: 'none' | 'fade' | 'slide'
  areaTouchText: {
    top?: number,
    bottom?: number,
    left?: number,
    right?: number
  }
  shouldGetAccessToken?: boolean
  isDisabled?: boolean
  renderButton?(): ReactNode
  renderClose?(): ReactNode
  onOpen?(): void
  onClose?(): void
  onSignIn?(): void
  onSuccess(result: LinkedInToken): void
  onError(error: ErrorType): void
}

export const cleanUrlString = (state: string) => state.replace('#!', '');

export const getCodeAndStateFromUrl = pipe(
  querystring.extract,
  querystring.parse,
  evolve({ state: cleanUrlString }),
);

export const getErrorFromUrl = pipe(
  querystring.extract,
  querystring.parse,
  evolve({ error_description: cleanUrlString }),
);

export const transformError = applySpec<ErrorType>({
  type: propOr('', 'error'),
  message: propOr('', 'error_description'),
});

export const isErrorUrl = pipe(
  querystring.extract,
  querystring.parse,
  propSatisfies((error: any) => typeof error !== 'undefined', 'error'),
);

export const injectedJavaScript = `
  setTimeout(function() {
    document.querySelector("input[type=text]").setAttribute("autocapitalize", "off");
  }, 1);
  true;
`;

export const getAuthorizationUrl = (
  {
    authState,
    clientID,
    permissions,
    redirectUri,
  }: Partial<Props>
) =>
  `${AUTHORIZATION_URL}?${querystring.stringify({
    response_type: 'code',
    client_id: clientID,
    scope: permissions!.join(' ').trim(),
    state: authState,
    redirect_uri: redirectUri,
  })}`;

export const getPayloadForToken = (
  {
    clientID,
    clientSecret,
    code,
    redirectUri,
  }: Partial<Props> & { code: string }
) =>
  querystring.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientID,
    client_secret: clientSecret,
  });

export const fetchToken = async (payload: any) => {
  const response = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  })
  return await response.json();
};

export const logError = (error: ErrorType) =>
  console.error(JSON.stringify(error, null, 2));

export const onLoadStart = async (
  url: string,
  authState: string,
  onSuccess: Props['onSuccess'],
  onError: Props['onError'],
  close: any,
  getAccessToken: (token: string) => Promise<LinkedInToken>,
  shouldGetAccessToken?: boolean,
) => {
  if (isErrorUrl(url)) {
    const err = getErrorFromUrl(url)
    close()
    onError(transformError(err))
  } else {
    const { code, state } = getCodeAndStateFromUrl(url)
    if (!shouldGetAccessToken) {
      onSuccess({ authentication_code: code as string })
    } else if (state !== authState) {
      onError({
        type: 'state_not_match',
        message: `state is not the same ${state}`,
      })
    } else {
      const token: LinkedInToken = await getAccessToken(code as string)
      onSuccess(token)
    }
  }
};
const closeSize = {width: 24, height: 24};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 40,
    paddingHorizontal: 10,
  },
  wrapper: {
    flex: 1,
    borderRadius: 5,
    borderWidth: 10,
    borderColor: 'rgba(0, 0, 0, 0.6)',
  },
  close: {
    position: 'absolute',
    top: 35,
    right: 5,
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...closeSize,
  },
});

export default class LinkedInModal extends React.Component<Props, State> {
  static propTypes = {
    clientID: PropTypes.string.isRequired,
    clientSecret: PropTypes.string,
    redirectUri: PropTypes.string.isRequired,
    permissions: PropTypes.array,
    authState: PropTypes.string,
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onSignIn: PropTypes.func,
    linkText: PropTypes.string,
    areaTouchText: PropTypes.object,
    renderButton: PropTypes.func,
    renderClose: PropTypes.func,
    containerStyle: ViewPropTypes.style,
    wrapperStyle: ViewPropTypes.style,
    closeStyle: ViewPropTypes.style,
    animationType: PropTypes.string,
    shouldGetAccessToken: PropTypes.bool,
  }
  static defaultProps = {
    onError: logError,
    permissions: ['r_liteprofile', 'r_emailaddress'],
    linkText: 'Login with LinkedIn',
    areaTouchText: {top: 20, bottom: 20, left: 50, right: 50},
    animationType: 'fade',
    containerStyle: StyleSheet.create({}),
    wrapperStyle: StyleSheet.create({}),
    closeStyle: StyleSheet.create({}),
    shouldGetAccessToken: true,
  }
  state: State = {
    raceCondition: false,
    modalVisible: false,
    authState: v4(),
    logout: false,
  }

  componentDidUpdate(nextProps: Props, nextState: State) {
    if (
      nextState.modalVisible !== this.state.modalVisible &&
      nextState.modalVisible === true
    ) {
      const authState = nextProps.authState || v4();
      this.setState(() => ({ raceCondition: false, authState }));
    }
  }

  onNavigationStateChange = async ({ url }: any) => {
    const {raceCondition} = this.state;
    const {redirectUri, onError, shouldGetAccessToken} = this.props;

    if (url.includes(redirectUri) && !raceCondition) {
      const {onSignIn, onSuccess} = this.props
      const {authState } = this.state
      this.setState({ modalVisible: false, raceCondition: true})
      if (onSignIn) {
        onSignIn();
      }
      await onLoadStart(
        url,
        authState,
        onSuccess,
        onError,
        this.close,
        this.getAccessToken,
        shouldGetAccessToken,
      );
    }
  }

  getAuthorizationUrl = () =>
    getAuthorizationUrl({...this.props, authState: this.state.authState});

  getAccessToken = async (code: string) => {
    const {onError} = this.props;
    const payload: string = getPayloadForToken({...this.props, code});
    const token = await fetchToken(payload);
    if (token.error) {
      onError(transformError(token));
      return {};
    }
    return token;
  };

  close = () => {
    const {onClose} = this.props;
    if (onClose) {
      onClose();
    }
    this.setState({modalVisible: false});
  };

  open = () => {
    const {onOpen} = this.props;
    if (onOpen) {
      onOpen();
    }
    this.setState({modalVisible: true});
  };

  logoutAsync = () =>
    new Promise<void>(resolve => {
      this.setState({logout: true});
      setTimeout(() => {
        this.setState({logout: false});
        resolve();
      }, 3000);
    });

  renderButton = () => {
    const {renderButton, linkText, areaTouchText, isDisabled = false} = this.props;
    if (renderButton) {
      return(
        <TouchableOpacity
          accessibilityRole={'button'}
          accessibilityState={{disabled: isDisabled}}
          onPress={this.open}
          hitSlop={areaTouchText}
          disabled={isDisabled}>
          {renderButton()}
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        accessibilityRole={'button'}
        accessibilityState={{disabled: isDisabled}}
        onPress={this.open}
        hitSlop={areaTouchText}
        disabled={isDisabled}
      >
        <Text>{linkText}</Text>
      </TouchableOpacity>
    );
  }

  renderClose = () => {
    const {renderClose} = this.props;
    if (renderClose) {
      return renderClose();
    }
    return (
      <Image
        source={require('./assets/x-white.png')}
        resizeMode="contain"
        style={{
          ...evolve({ width: add(-8), height: add(-8) }, closeSize),
        }}
      />
    );
  }

  renderWebview = () => {
    const { modalVisible } = this.state
    if (!modalVisible) {
      return null;
    }

    return (
      <WebView
        source={{ uri: this.getAuthorizationUrl() }}
        onNavigationStateChange={this.onNavigationStateChange}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScript={injectedJavaScript}
        sharedCookiesEnabled
        incognito={true}
      />
    );
  }

  render() {
    const {modalVisible, logout} = this.state;
    const {
      animationType,
      containerStyle,
      wrapperStyle,
      closeStyle,
    } = this.props;
    return (
      <View>
        {this.renderButton()}
        <Modal
          animationType={animationType}
          transparent
          visible={modalVisible}
          onRequestClose={this.close}
        >
          <View style={[styles.container, containerStyle]}>
            <View style={[styles.wrapper, wrapperStyle]}>
              {this.renderWebview()}
            </View>
            <TouchableOpacity
              onPress={this.close}
              style={[styles.close, closeStyle]}
              accessibilityRole={'button'}
            >
              {this.renderClose()}
            </TouchableOpacity>
          </View>
        </Modal>
        {logout && (
          <View style={{ width: 1, height: 1 }}>
            <WebView
              source={{ uri: LOGOUT_URL }}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              onLoadEnd={() => this.setState({ logout: false })}
            />
          </View>
        )}
      </View>
    );
  }
}
