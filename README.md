<p align="center">
    <img alt="react-native-linkedin" src="https://thumbs.gfycat.com/IlliterateSecondDassie-size_restricted.gif" width=250>
</p>

<h3 align="center">
  🔗 React-Native LinkedIn
</h3>
<p align="center">
Simple <strong>LinkedIn</strong> login library for <strong>React-Native</strong> with <i>WebView</i> into a <i>Modal</i>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@gcou/react-native-linkedin"><img src="https://img.shields.io/npm/v/@gcou/react-native-linkedin.svg"></a>
  <a href="https://www.npmjs.com/package/@gcou/react-native-linkedin"><img src="https://img.shields.io/npm/dm/@gcou/react-native-linkedin.svg?style=flat-square"></a>
</p>

<br />

## Benefits

- **Light**: No need to link a native library like others alternatives
- **Simple**: Get the token and the expires, you handle your own login with the access_token
- **Sure**: open-source
- **Almost readable & understandable code**: JavaScript & React

## Installation

```bash
$ yarn add @gcou/react-native-linkedin
```

## Security

Please note that you should give your linkedin client id but not your secret key to this component.
You should be aware that key can be found if you store it directly to your code.
**I strongly recommend to not declare client secret key on your code but found a way to keep it secret**

- [> LinkedIn Documentation](https://docs.microsoft.com/en-us/linkedin/shared/api-guide/best-practices/secure-applications?context=linkedin/context#api-key-and-secret-key)

```tsx
  <LinkedInModal
    shouldGetAccessToken={false}
    clientID="[ Your client id from https://www.linkedin.com/developer/apps ]"
    redirectUri="[ Your redirect uri set into https://www.linkedin.com/developer/apps ]"
    onSuccess={({ authentication_code }) => console.log(`Post this ${authentication_code} to your server.`)}
  />
```

## Example

```JavaScript
// See ./example/App.tsx file for details
import React, { ReactElement, useRef } from 'react';
import { StyleSheet, View, Button } from 'react-native';

import LinkedInModal, { LinkedInModalRef } from '@gcou/react-native-linkedin';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default function AppContainer() : ReactElement {
  const linkedRef = useRef<LinkedInModalRef>(null);
  
  return (
    <View style={styles.container}>
      <LinkedInModal
        ref={linkedRef}
        clientID="[ Your client id from https://www.linkedin.com/developer/apps ]"
        clientSecret="[ Your client secret from https://www.linkedin.com/developer/apps ]"
        redirectUri="[ Your redirect uri set into https://www.linkedin.com/developer/apps ]"
        onSuccess={token => console.log(token)}
      />
      <Button title="Log Out" onPress={() => linkedRef.current?.logoutAsync()} />
    </View>
  )
}
```

## Props

| Name                     | Type                          | Required                                                                              | Default                             | Description                                                                                                                                                                                              |
| ------------------------ |-------------------------------| ------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| clientID                 | string                        | **required**                                                                          |                                     | [Your client id](https://www.linkedin.com/developer/apps)                                                                                                                                                |
| <s>clientSecret</s>      | string                        | use **shouldGetAccessToken={false}** and read **authorization_code** onSuccess return |                                     | Should not be stored in app [WARNING! Your client secret](https://docs.microsoft.com/en-us/linkedin/shared/api-guide/best-practices/secure-applications?context=linkedin/context#api-key-and-secret-key) |
| redirectUri              | string                        | **required**                                                                          |                                     | [Your redirectUri](https://www.linkedin.com/developer/apps)                                                                                                                                              |
| onSuccess                | function                      | **required**                                                                          |                                     | Function will be call back on success                                                                                                                                                                    |
| authState                | string                        | optional                                                                              | `require('uuid').v4()`              | The state of auth, to be more secure                                                                                                                                                                     |
| onError                  | function                      | optional                                                                              | `console.error(err)`                | Function will be call back on error                                                                                                                                                                      |
| onClose                  | function                      | optional                                                                              |                                     | Function will be call back on close modal                                                                                                                                                                |
| onOpen                   | function                      | optional                                                                              |                                     | Function will be call back on open modal                                                                                                                                                                 |
| onSignIn                 | function                      | optional                                                                              |                                     | Function will be call back when the user sign in                                                                                                                                                         |
| permissions              | string[]                      | optional                                                                              | `'r_liteprofile', 'r_emailaddress'` | The LinkedIn access token permissions                                                                                                                                                                    |
| renderButton             | ReactElement                  | optional                                                                              |                                     | Render for customize LinkedIn button                                                                                                                                                            |
| renderClose              | ReactElement                  | optional                                                                              |                                     | Render for customize close button                                                                                                                                                               |
| linkText                 | string                        | optional                                                                              | `'Login with LinkedIn'`             | Link label                                                                                                                                                                                               |
| containerStyle           | StyleProp<ViewStyle>          | optional                                                                              |                                     | Customize container style                                                                                                                                                                                |
| wrapperStyle             | StyleProp<ViewStyle>          | optional                                                                              |                                     | Customize wrapper style                                                                                                                                                                                  |
| closeStyle               | StyleProp<ViewStyle>          | optional                                                                              |                                     | Customize close style                                                                                                                                                                                    |
| animationType            | Modal.propTypes.animationType | optional                                                                              | `fade`                              | Customize animationType style: 'none', 'slide' or 'fade'                                                                                                                                                 |
| **shouldGetAccessToken** | bool                          | optional                                                                              | `true`                              | Set to false to receive the 'authorization code' rather then the 'access token'                                                                                                                          |
| areaTouchText | object                        | optional       | `{top: 20, bottom: 20, left: 50, right: 50}`          | Set values for to increase the text touch area          |
| isDisabled               | bool                           | optional                                                                              | `false`                              | Disable the LinkedIn login button                                                                                                                                                                        |

## Contribution

- [@xcarpentier](mailto:contact@xaviercarpentier.com) The main author.

**PRs are welcome!**

## FAQ

### Is it supported and tested both on android and iOS?

**YES**

### How to logout react-native-linkedin?
```tsx
<View style={styles.container}>
    <LinkedInModal
      ref={linkedRef}
      clientID="[ Your client id from https://www.linkedin.com/developer/apps ]"
      clientSecret="[ Your client secret from https://www.linkedin.com/developer/apps ]"
      redirectUri="[ Your redirect uri set into https://www.linkedin.com/developer/apps ]"
      onSuccess={token => console.log(token)}
    />
    <Button title="Log Out" onPress={() => linkedRef.current?.logoutAsync()} />
</View>
```

## Alternatives

- [react-native-linkedin-login](https://www.npmjs.com/package/react-native-linkedin-login)
- [react-native-linkedin-sdk](https://www.npmjs.com/package/react-native-linkedin-sdk)
- [react-native-linkedin-oauth](https://www.npmjs.com/package/react-native-linkedin-oauth)

## Licence

[MIT](https://github.com/GaelCO/react-native-linkedin/blob/master/LICENSE)

> made with ♥
