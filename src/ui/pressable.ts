/**
 * The app's Pressable: react-native-gesture-handler's, which decides whether a tap landed on the
 * button natively. React Native's own Pressable checks that against a JavaScript measurement of
 * the button, which on Android (New Architecture) can be off inside native screens, so a tap is
 * judged to have ended outside and onPress never fires (react-navigation#12039). Same API.
 *
 * Inside a React Native <Modal>, wrap the content in <ModalGestureRoot> so these keep working
 * on Android.
 */
export { Pressable, type PressableProps } from 'react-native-gesture-handler';
