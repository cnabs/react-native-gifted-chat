import PropTypes from 'prop-types';
import React from 'react';
import { Animated, Platform, View, Dimensions } from 'react-native';
import ActionSheet from '@expo/react-native-action-sheet';
import moment from 'moment';
import uuid from 'uuid';
import * as utils from './utils';
import Actions from './Actions';
import Avatar from './Avatar';
import Bubble from './Bubble';
import SystemMessage from "./SystemMessage";;
import MessageImage from './MessageImage';
import MessageText from './MessageText';
import Composer from './Composer';
import Day from './Day';
import InputToolbar from './InputToolbar';
import LoadEarlier from './LoadEarlier';
import Message from './Message';
import MessageContainer from './MessageContainer';
import Send from './Send';
import Time from './Time';
import GiftedAvatar from './GiftedAvatar';
import styles from './style';
import { ChatMessages, ChatInputToolbar, ChatInitialView } from 'react-native-gifted-chat/src/components';

const window = Dimensions.get('window');

function getInitialContainerHeight() {
  const toolBarHeight = 55;
  const height = window.height - toolBarHeight;
  return height;
  // return new Animated.Value(height);
}

function append(currentMessages = [], messages) {
  if (!Array.isArray(messages)) {
    messages = [messages];
  }
  return messages.concat(currentMessages);
}

function prepend(currentMessages = [], messages) {
  if (!Array.isArray(messages)) {
    messages = [messages];
  }
  return currentMessages.concat(messages);
}

// Min and max heights of ToolbarInput and Composer
// Needed for Composer auto grow and ScrollView animation
// TODO move these values to Constants.js (also with used colors #b2b2b2)
const MIN_COMPOSER_HEIGHT = Platform.select({ ios: 33, android: 41 });
const MAX_COMPOSER_HEIGHT = 100;

class GiftedChat extends React.Component {
  constructor(props) {
    super(props);

    // default values
    this._isMounted = false;
    this._keyboardHeight = 0;
    this._bottomOffset = 0;
    this._maxHeight = null;
    this._isFirstLayout = true;
    this._locale = 'en';
    this._messages = [];

    this.state = {
      isInitialized: false, // initialization will calculate maxHeight before rendering the chat
      composerHeight: MIN_COMPOSER_HEIGHT,
      // messagesContainerHeight: null,
      containerHeight: getInitialContainerHeight(),
      typingDisabled: false
    };

    this.onKeyboardWillShow = this.onKeyboardWillShow.bind(this);
    this.onKeyboardWillHide = this.onKeyboardWillHide.bind(this);
    this.onKeyboardDidShow = this.onKeyboardDidShow.bind(this);
    this.onKeyboardDidHide = this.onKeyboardDidHide.bind(this);

    this.onSend = this.onSend.bind(this);
    this.getLocale = this.getLocale.bind(this);
    this.onInputSizeChanged = this.onInputSizeChanged.bind(this);
    this.onInputTextChanged = this.onInputTextChanged.bind(this);
    this.onMainViewLayout = this.onMainViewLayout.bind(this);
    this.onInitialLayoutViewLayout = this.onInitialLayoutViewLayout.bind(this);


    this.invertibleScrollViewProps = {
      inverted: true,
      keyboardShouldPersistTaps: this.props.keyboardShouldPersistTaps,
      onKeyboardWillShow: this.onKeyboardWillShow,
      onKeyboardWillHide: this.onKeyboardWillHide,
      onKeyboardDidShow: this.onKeyboardDidShow,
      onKeyboardDidHide: this.onKeyboardDidHide,
    };
  }

  static append = (currentMessages = [], messages) => append(currentMessages, messages);

  static prepend = (currentMessages = [], messages) => prepend(currentMessages, messages);

  componentWillMount() {
    const { messages, text } = this.props;
    this.setIsMounted(true);
    this.initLocale();
    this.setMessages(messages || []);
    this.setTextFromProp(text);
  }

  componentWillUnmount() {
    this.setIsMounted(false);
  }

  componentWillReceiveProps(nextProps = {}) {
    const { messages, text } = nextProps;
    this.setMessages(messages || []);
    this.setTextFromProp(text);
  }

  getChildContext() {
    return {
      actionSheet: () => this._actionSheetRef,
      getLocale: this.getLocale,
    };
  }

  initLocale() {
    if (this.props.locale === null || moment.locales().indexOf(this.props.locale) === -1) {
      this.setLocale('en');
      return;
    }
    this.setLocale(this.props.locale);
  }

  setLocale(locale) {
    this._locale = locale;
  }

  getLocale() {
    return this._locale;
  }

  setTextFromProp(textProp) {
    // Text prop takes precedence over state.
    if (textProp !== undefined && textProp !== this.state.text) {
      this.setState({ text: textProp });
    }
  }

  getTextFromProp(fallback) {
    if (this.props.text === undefined) return fallback;

    return this.props.text;
  }

  setMessages(messages) {
    this._messages = messages;
  }

  getMessages() {
    return this._messages;
  }

  setMaxHeight(height) {
    this._maxHeight = height;
  }

  getMaxHeight() {
    return this._maxHeight;
  }

  setKeyboardHeight(height) {
    this._keyboardHeight = height;
  }

  getKeyboardHeight() {
    if (Platform.OS === 'android' && !this.props.forceGetKeyboardHeight) {
      // For android: on-screen keyboard resized main container and has own height.
      // @see https://developer.android.com/training/keyboard-input/visibility.html
      // So for calculate the messages container height ignore keyboard height.
      return 0;
    }
    return this._keyboardHeight;
  }

  setBottomOffset(value) {
    this._bottomOffset = value;
  }

  getBottomOffset() {
    return this._bottomOffset;
  }

  setIsFirstLayout(value) {
    this._isFirstLayout = value;
  }

  getIsFirstLayout() {
    return this._isFirstLayout;
  }

  setIsTypingDisabled(value) {
    this.setState({
      typingDisabled: value
    });
  }

  getIsTypingDisabled() {
    const { typingDisabled } = this.state;
    return typingDisabled;
  }

  setIsMounted(value) {
    this._isMounted = value;
  }

  getIsMounted() {
    return this._isMounted;
  }

  // TODO
  // setMinInputToolbarHeight
  getMinInputToolbarHeight() {
    const { renderAccessory, minInputToolbarHeight } = this.props;
    return renderAccessory ? minInputToolbarHeight * 2 : minInputToolbarHeight;
  }

  calculateInputToolbarHeight(composerHeight) {
    return composerHeight + (this.getMinInputToolbarHeight() - MIN_COMPOSER_HEIGHT);
  }

  /** Returns the height, based on current window size, without taking the keyboard into account. */
  getBasicMessagesContainerHeight(composerHeight = this.state.composerHeight) {
    // return this.getMaxHeight() - this.calculateInputToolbarHeight(composerHeight);

    return getInitialContainerHeight();
  }

  /** Returns the height, based on current window size, taking the keyboard into account. */
  getMessagesContainerHeightWithKeyboard(composerHeight = this.state.composerHeight) {
    // return this.getBasicMessagesContainerHeight(composerHeight) - this.getKeyboardHeight() + this.getBottomOffset();

    return this.state.containerHeight - this.getKeyboardHeight();
  }

  prepareMessagesContainerHeight(value) {
    const { isAnimated } = this.props;
    if (isAnimated) return new Animated.Value(value);

    return value;
  }

  onKeyboardWillShow(e) {
    // this.setIsTypingDisabled(true);
    // this.setKeyboardHeight(e.endCoordinates ? e.endCoordinates.height : e.end.height);
    // const { isAnimated, bottomOffset } = this.props;
    // const { messagesContainerHeight } = this.state;
    // this.setBottomOffset(bottomOffset);
    // const newMessagesContainerHeight = this.getMessagesContainerHeightWithKeyboard();
    // if (isAnimated) {
    //   Animated.timing(messagesContainerHeight, {
    //     toValue: newMessagesContainerHeight,
    //     duration: 210,
    //   }).start();
    //   return;
    // }
    // this.setState({
    //   messagesContainerHeight: newMessagesContainerHeight,
    // }); 

    this.setIsTypingDisabled(true);
    this.setKeyboardHeight(e.endCoordinates ? e.endCoordinates.height : e.end.height);
    const { isAnimated, bottomOffset } = this.props;
    const { containerHeight } = this.state;
    this.setBottomOffset(bottomOffset);
    const newContainerHeight = this.getMessagesContainerHeightWithKeyboard();
    // if (isAnimated) {
    //   Animated.timing(containerHeight, {
    //     toValue: newContainerHeight,
    //     duration: 210,
    //   }).start();
    //   return;
    // }
    this.setState({
      containerHeight: newContainerHeight,
    }); 
  }

  onKeyboardWillHide() {
    // this.setIsTypingDisabled(true);
    // this.setKeyboardHeight(0);
    // this.setBottomOffset(0);
    // const newMessagesContainerHeight = this.getBasicMessagesContainerHeight();
    // const { isAnimated } = this.props;
    // if (isAnimated) {
    //   Animated.timing(this.state.messagesContainerHeight, {
    //     toValue: newMessagesContainerHeight,
    //     duration: 210,
    //   }).start();
    //   return;
    // }
    // this.setState({
    //   messagesContainerHeight: newMessagesContainerHeight,
    // });

    this.setIsTypingDisabled(true);
    this.setKeyboardHeight(0);
    this.setBottomOffset(0);
    const newContainerHeight = this.getBasicMessagesContainerHeight();
    const { isAnimated } = this.props;
    const { containerHeight } = this.state;
    // if (isAnimated) {
    //   Animated.timing(containerHeight, {
    //     toValue: newMessagesContainerHeight,
    //     duration: 210,
    //   }).start();
    //   return;
    // }
    this.setState({
      containerHeight: newContainerHeight,
    });
  }

  onKeyboardDidShow(e) {
    if (Platform.OS === 'android') {
      this.onKeyboardWillShow(e);
    }
    this.setIsTypingDisabled(false);
  }

  onKeyboardDidHide(e) {
    if (Platform.OS === 'android') {
      this.onKeyboardWillHide(e);
    }
    this.setIsTypingDisabled(false);
  }

  scrollToBottom(animated = true) {
    if (!this._messageContainerRef) return;

    this._messageContainerRef.scrollTo({
      y: 0,
      animated,
    });
  }

  onSend(messages = [], shouldResetInputToolbar = false) {
    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    messages = messages.map((message) => {
      return {
        ...message,
        user: this.props.user,
        createdAt: new Date(),
        _id: this.props.messageIdGenerator(),
      };
    });

    if (shouldResetInputToolbar) {
      this.setIsTypingDisabled(true);
      this.resetInputToolbar();
    }

    const { onSend } = this.props;
    onSend(messages);
    this.scrollToBottom();

    if (shouldResetInputToolbar) {
      setTimeout(() => {
        if (this.getIsMounted()) {
          this.setIsTypingDisabled(false);
        }
      }, 100);
    }
  }

  resetInputToolbar() {
    if (this.textInput) {
      this.textInput.clear();
    }
    this.notifyInputTextReset();
    const newComposerHeight = MIN_COMPOSER_HEIGHT;
    const newMessagesContainerHeight = this.getMessagesContainerHeightWithKeyboard(newComposerHeight);
    this.setState({
      text: this.getTextFromProp(''),
      composerHeight: newComposerHeight,
      // messagesContainerHeight: this.prepareMessagesContainerHeight(newMessagesContainerHeight),
    });
  }

  focusTextInput() {
    const { textInput } = this;
    if (textInput) {
      textInput.focus();
    }
  }

  onInputSizeChanged(size) {
    const newComposerHeight = Math.max(MIN_COMPOSER_HEIGHT, Math.min(MAX_COMPOSER_HEIGHT, size.height));
    const newMessagesContainerHeight = this.getMessagesContainerHeightWithKeyboard(newComposerHeight);
    this.setState({
      composerHeight: newComposerHeight,
      // messagesContainerHeight: this.prepareMessagesContainerHeight(newMessagesContainerHeight),
    });
  }

  onInputTextChanged(text) {
    if (this.getIsTypingDisabled()) return;

    const { onInputTextChanged, text: propText } = this.props;
    if (onInputTextChanged) {
      onInputTextChanged(text);
    }
    // Only set state if it's not being overridden by a prop.
    if (propText === undefined) {
      this.setState({ text });
    }
  }

  notifyInputTextReset() {
    const { onInputTextChanged } = this.props;
    if (onInputTextChanged) {
      onInputTextChanged('');
    }
  }

  onInitialLayoutViewLayout(e) {
    const layout = e.nativeEvent.layout;
    if (layout.height <= 0) return;

    this.notifyInputTextReset();
    this.setMaxHeight(layout.height);
    const newComposerHeight = MIN_COMPOSER_HEIGHT;
    const newMessagesContainerHeight = this.getMessagesContainerHeightWithKeyboard(newComposerHeight);
    this.setState({
      isInitialized: true,
      text: this.getTextFromProp(''),
      composerHeight: newComposerHeight,
      // messagesContainerHeight: this.prepareMessagesContainerHeight(newMessagesContainerHeight),
    });
  }

  onMainViewLayout(e) {
    // fix an issue when keyboard is dismissing during the initialization
    const layout = e.nativeEvent.layout;
    if (this.getMaxHeight() !== layout.height || this.getIsFirstLayout()) {
      this.setMaxHeight(layout.height);
      this.setState({
        // messagesContainerHeight: this.prepareMessagesContainerHeight(this.getBasicMessagesContainerHeight()),
      });
    }
    if (this.getIsFirstLayout()) {
      this.setIsFirstLayout(false);
    }
    const { onMainViewLayout } = this.props;
    if (onMainViewLayout) {
      onMainViewLayout(layout)
    }
  }

  render() {
    // const { isInitialized, messagesContainerHeight, containerHeight } = this.state;
    const { isInitialized, containerHeight } = this.state;
    const { textInputProps, maxInputLength, renderInputToolbar, renderLoading, messagesContainerHeight } = this.props;
    if (!isInitialized) return <ChatInitialView renderLoading={renderLoading} onLayout={this.onInitialLayoutViewLayout} />;

    const messages = this.getMessages();
    const text = this.getTextFromProp(this.state.text);
    const composerHeight = Math.max(MIN_COMPOSER_HEIGHT, this.state.composerHeight);
    const maxLength = this.getIsTypingDisabled() ? 0 : maxInputLength;
    const isTypingDisabled = this.getIsTypingDisabled();
    return (
      <ActionSheet ref={component => this._actionSheetRef = component}>
        <View style={styles.container} onLayout={this.onMainViewLayout}>
          <ChatMessages 
            {...this.props} 
            containerHeight={messagesContainerHeight} 
            invertibleScrollViewProps={this.invertibleScrollViewProps}
            messages={messages}
            messageContainerRef={component => this._messageContainerRef = component}
          />
          <ChatInputToolbar
            {...this.props}
            text={text}
            composerHeight={composerHeight}
            onSend={this.onSend}
            onInputSizeChanged={this.onInputSizeChanged}
            onInputTextChanged={this.onInputTextChanged}
            textInputProps={{...textInputProps}}
            textInputRef={textInput => this.textInput = textInput}
            maxLength={maxLength}
            isTypingDisabled={isTypingDisabled}
            renderInputToolbar={renderInputToolbar}
          />
        </View>
      </ActionSheet>
    );
  }
}

GiftedChat.childContextTypes = {
  actionSheet: PropTypes.func,
  getLocale: PropTypes.func,
};

GiftedChat.defaultProps = {
  messages: [],
  text: undefined,
  placeholder: 'Type a message...',
  messageIdGenerator: () => uuid.v4(),
  user: {},
  onSend: () => {},
  locale: null,
  timeFormat: 'LT',
  dateFormat: 'll',
  isAnimated: Platform.select({
    ios: true,
    android: false,
  }),
  loadEarlier: false,
  onLoadEarlier: () => {},
  isLoadingEarlier: false,
  renderLoading: null,
  renderLoadEarlier: null,
  renderAvatar: undefined,
  showUserAvatar: false,
  onPressAvatar: null,
  renderAvatarOnTop: false,
  renderBubble: null,
  renderSystemMessage: null,
  onLongPress: null,
  renderMessage: null,
  renderMessageText: null,
  renderMessageImage: null,
  imageProps: {},
  lightboxProps: {},
  renderCustomView: null,
  renderDay: null,
  renderTime: null,
  renderFooter: null,
  renderChatFooter: null,
  renderInputToolbar: null,
  renderComposer: null,
  renderActions: null,
  renderSend: null,
  renderAccessory: null,
  onPressActionButton: null,
  bottomOffset: 0,
  minInputToolbarHeight: 44,
  listViewProps: {},
  keyboardShouldPersistTaps: Platform.select({
    ios: 'never',
    android: 'always',
  }),
  onInputTextChanged: null,
  maxInputLength: null,
  forceGetKeyboardHeight: false,
};

export {
  GiftedChat,
  Actions,
  Avatar,
  Bubble,
  SystemMessage,
  MessageImage,
  MessageText,
  Composer,
  Day,
  InputToolbar,
  LoadEarlier,
  Message,
  MessageContainer,
  Send,
  Time,
  GiftedAvatar,
  utils
};
