import 'react-native-get-random-values';
import React, {
  ForwardedRef,
  forwardRef,
  ReactElement,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  Image,
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { evolve, add } from 'ramda';
import { v4 as uuid } from 'uuid';
import {
  ErrorType,
  fetchToken,
  getAuthorizationUrl,
  getCodeAndStateFromUrl,
  getErrorFromUrl,
  getPayloadForToken,
  isErrorUrl,
  LinkedInToken,
  LOGOUT_URL,
  transformError,
} from './oauth';

export interface LinkedInModalRef {
  open: () => void;
  close: () => void;
  logoutAsync: () => Promise<void>;
}

export const injectedJavaScript = `
  setTimeout(function() {
    document.querySelector("input[type=text]").setAttribute("autocapitalize", "off");
  }, 1);
  true;
`;

const closeSize = { width: 24, height: 24 };

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

export const logError = (error: ErrorType) =>
  console.error(JSON.stringify(error, null, 2));

export const onLoadStart = async (
  url: string,
  authState: string,
  onSuccess: LinkedInModalPropTypes['onSuccess'],
  onError: LinkedInModalPropTypes['onError'],
  close: () => void,
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
    const { code, state } = getCodeAndStateFromUrl(url);
    if (!shouldGetAccessToken) {
      onSuccess({ authentication_code: code as string });
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
    areaTouchText = { top: 20, bottom: 20, left: 50, right: 50 },
    renderButton,
    renderClose,
    containerStyle = StyleSheet.create({}),
    wrapperStyle = StyleSheet.create({}),
    closeStyle = StyleSheet.create({}),
    animationType = 'fade',
    shouldGetAccessToken = true,
    isDisabled = false,
  }: LinkedInModalPropTypes,
  ref: ForwardedRef<LinkedInModalRef>,
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
  }, [modalVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(
    ref,
    (): LinkedInModalRef => ({
      open: async () => {
        _open();
      },

      close: async () => {
        _close();
      },

      logoutAsync: async () => {
        await _logoutAsync();
      },
    }),
  );

  const onNavigationStateChange = async ({ url }: { url: string }) => {
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
    const payload = getPayloadForToken({
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

  const _logoutAsync = async () =>
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
          accessibilityState={{ disabled: isDisabled }}
          onPress={_open}
          hitSlop={areaTouchText}
          disabled={isDisabled}
        >
          {renderButton}
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        accessibilityRole={'button'}
        accessibilityState={{ disabled: isDisabled }}
        onPress={_open}
        hitSlop={areaTouchText}
        disabled={isDisabled}
      >
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
          ...evolve({ width: add(-8), height: add(-8) }, closeSize),
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
        source={url ? { uri: url } : undefined}
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
        onRequestClose={_close}
      >
        <View style={[styles.container, containerStyle]}>
          <View style={[styles.wrapper, wrapperStyle]}>
            {getWebviewElement()}
          </View>
          <TouchableOpacity
            onPress={_close}
            style={[styles.close, closeStyle]}
            accessibilityRole={'button'}
          >
            {getCloseElement()}
          </TouchableOpacity>
        </View>
      </Modal>
      {logout && (
        <View style={styles.logoutContainer}>
          <WebView
            source={{ uri: LOGOUT_URL }}
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
