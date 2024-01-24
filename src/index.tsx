import 'react-native-get-random-values';
import React, {
  forwardRef,
  ReactElement,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Modal,
  StyleSheet,
  Image,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {pipe, evolve, propSatisfies, applySpec, propOr, add} from 'ramda';
import querystring from 'query-string';
import {v4 as uuid} from 'uuid';

const AUTHORIZATION_URL: string =
  'https://www.linkedin.com/oauth/v2/authorization';
const ACCESS_TOKEN_URL: string =
  'https://www.linkedin.com/oauth/v2/accessToken';
const LOGOUT_URL: string = 'https://www.linkedin.com/m/logout';

export interface LinkedInToken {
  authentication_code?: string;
  access_token?: string;
  expires_in?: number;
}

export interface ErrorType {
  type?: string;
  message?: string;
}

export const cleanUrlString = (state: string) => state.replace('#!', '');

export const getCodeAndStateFromUrl = pipe(
  querystring.extract,
  querystring.parse,
  evolve({state: cleanUrlString}),
);

export const getErrorFromUrl = pipe(
  querystring.extract,
  querystring.parse,
  evolve({error_description: cleanUrlString}),
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

export const getAuthorizationUrl = ({
  authState,
  clientID,
  permissions,
  redirectUri,
}: Partial<LinkedInModalPropTypes>) =>
  `${AUTHORIZATION_URL}?${querystring.stringify({
    response_type: 'code',
    client_id: clientID,
    scope: permissions!.join(' ').trim(),
    state: authState,
    redirect_uri: redirectUri,
  })}`;

export const getPayloadForToken = ({
  clientID,
  clientSecret,
  code,
  redirectUri,
}: Partial<LinkedInModalPropTypes> & {code: string}) =>
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
  });
  return await response.json();
};

export const logError = (error: ErrorType) =>
  console.error(JSON.stringify(error, null, 2));

export const onLoadStart = async (
  url: string,
  authState: string,
  onSuccess: LinkedInModalPropTypes['onSuccess'],
  onError: LinkedInModalPropTypes['onError'],
  close: any,
  getAccessToken: (token: string) => Promise<LinkedInToken>,
  shouldGetAccessToken?: boolean,
) => {
  if (isErrorUrl(url)) {
    const err = getErrorFromUrl(url);
    close();
    if (onError) {
      onError(transformError(err));
    }
  } else {
    const {code, state} = getCodeAndStateFromUrl(url);
    if (!shouldGetAccessToken) {
      onSuccess({authentication_code: code as string});
    } else if (state !== authState) {
      if (onError) {
        onError({
          type: 'state_not_match',
          message: `state is not the same ${state}`,
        });
      }
    } else {
      const token: LinkedInToken = await getAccessToken(code as string);
      onSuccess(token);
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
  logoutContainer: {
    width: 1,
    height: 1,
  },
});

export default forwardRef(function LinkedInModal(
  {
    clientID,
    clientSecret,
    redirectUri,
    permissions = ['r_liteprofile', 'r_emailaddress'],
    authState,
    onSuccess,
    onError = logError,
    onOpen,
    onClose,
    onSignIn,
    linkText = 'Login with LinkedIn',
    areaTouchText = {top: 20, bottom: 20, left: 50, right: 50},
    renderButton,
    renderClose,
    containerStyle = StyleSheet.create({}),
    wrapperStyle = StyleSheet.create({}),
    closeStyle = StyleSheet.create({}),
    animationType = 'fade',
    shouldGetAccessToken = true,
    isDisabled = false,
  }: LinkedInModalPropTypes,
  ref: any,
): ReactElement {
  const [raceCondition, setRaceCondition] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentAuthState, setCurrentAuthState] = useState<string>(uuid());
  const [logout, setLogout] = useState<boolean>(false);

  useEffect(() => {
    if (modalVisible) {
      const tmpAuthState = authState ?? uuid();
      setRaceCondition(false);
      setCurrentAuthState(tmpAuthState);
    }
  }, [modalVisible]);

  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(ref, () => ({
    open: async () => {
      await _open();
    },

    close: async () => {
      await _close();
    },

    logoutAsync: async () => {
      await _logoutAsync();
    },
  }));

  const onNavigationStateChange = async ({url}: any) => {
    if (url.includes(redirectUri) && !raceCondition) {
      setModalVisible(false);
      setRaceCondition(true);

      if (onSignIn) {
        onSignIn();
      }
      await onLoadStart(
        url,
        currentAuthState,
        onSuccess,
        onError,
        _close,
        _getAccessToken,
        shouldGetAccessToken,
      );
    }
  };

  const _getAccessToken = async (code: string) => {
    const payload: string = getPayloadForToken({
      clientID,
      clientSecret,
      code,
      redirectUri,
    });
    const token = await fetchToken(payload);
    if (token.error) {
      if (onError) {
        onError(transformError(token));
      }
      return {};
    }
    return token;
  };

  const _close = () => {
    if (onClose) {
      onClose();
    }
    setModalVisible(false);
  };

  const _open = () => {
    if (onOpen) {
      onOpen();
    }
    setModalVisible(true);
  };

  const _logoutAsync = () =>
    new Promise<void>(resolve => {
      setLogout(true);
      setTimeout(() => {
        setLogout(false);
        resolve();
      }, 3000);
    });

  const getButtonElement = (): ReactElement => {
    if (renderButton) {
      return (
        <TouchableOpacity
          accessibilityRole={'button'}
          accessibilityState={{disabled: isDisabled}}
          onPress={_open}
          hitSlop={areaTouchText}
          disabled={isDisabled}>
          {renderButton}
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        accessibilityRole={'button'}
        accessibilityState={{disabled: isDisabled}}
        onPress={_open}
        hitSlop={areaTouchText}
        disabled={isDisabled}>
        <Text>{linkText}</Text>
      </TouchableOpacity>
    );
  };

  const getCloseElement = (): ReactElement => {
    if (renderClose) {
      return renderClose;
    }
    return (
      <Image
        source={require('./assets/x-white.png')}
        resizeMode="contain"
        style={{
          ...evolve({width: add(-8), height: add(-8)}, closeSize),
        }}
      />
    );
  };

  const getWebviewElement = () => {
    if (!modalVisible) {
      return null;
    }

    const url = getAuthorizationUrl({
      authState: currentAuthState,
      clientID: clientID,
      permissions: permissions,
      redirectUri: redirectUri,
    });

    return (
      <WebView
        source={url ? {uri: url} : undefined}
        onNavigationStateChange={onNavigationStateChange}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJavaScript}
        sharedCookiesEnabled={true}
        incognito={true}
      />
    );
  };

  return (
    <View>
      {getButtonElement()}
      <Modal
        animationType={animationType}
        transparent
        visible={modalVisible}
        onRequestClose={_close}>
        <View style={[styles.container, containerStyle]}>
          <View style={[styles.wrapper, wrapperStyle]}>
            {getWebviewElement()}
          </View>
          <TouchableOpacity
            onPress={_close}
            style={[styles.close, closeStyle]}
            accessibilityRole={'button'}>
            {getCloseElement()}
          </TouchableOpacity>
        </View>
      </Modal>
      {logout && (
        <View style={styles.logoutContainer}>
          <WebView
            source={{uri: LOGOUT_URL}}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            onLoadEnd={() => setLogout(false)}
          />
        </View>
      )}
    </View>
  );
});

export type LinkedInModalPropTypes = {
  clientID: string;
  clientSecret?: string;
  redirectUri: string;
  permissions?: string[];
  authState?: string;
  onSuccess: (result: LinkedInToken) => void;
  onError?: (error: ErrorType) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onSignIn?: () => void;
  linkText?: string;
  areaTouchText?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  renderButton?: ReactElement;
  renderClose?: ReactElement;
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  closeStyle?: StyleProp<ViewStyle>;
  animationType?: 'none' | 'fade' | 'slide';
  shouldGetAccessToken?: boolean;
  isDisabled?: boolean;
};
