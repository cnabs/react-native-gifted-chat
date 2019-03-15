import React from 'react'
import MessageContainer from './MessageContainer';
import { Animated, View } from 'react-native';
import InputToolbar from './InputToolbar';
import styles from './style';

function ChatFooter(props) {
  const { renderChatFooter } = props
  if (renderChatFooter) {
    const footerProps = { ...props };
    return renderChatFooter(footerProps);
  }
  return null;
}

export function ChatMessages(props) {
  const { 
    isAnimated, 
    containerHeight, 
    invertibleScrollViewProps, 
    messages,
    messageContainerRef,
  } = props
  const AnimatedView = isAnimated ? Animated.View : View;
  const style = { height: containerHeight };
  return (
    <AnimatedView style={style}>
      <MessageContainer
        {...props}
        invertibleScrollViewProps={invertibleScrollViewProps}
        messages={messages}
        ref={messageContainerRef}
      />
      <ChatFooter {...props} />
    </AnimatedView>
  );
}

export function ChatInputToolbar(props) {
  const { 
    text, 
    composerHeight, 
    onSend, 
    onInputSizeChanged,
    onInputTextChanged,
    textInputProps,
    textInputRef,
    maxLength,
    isTypingDisabled,
    renderInputToolbar,
  } = props;
  const inputToolbarProps = {
    ...props,
    text: text,
    composerHeight: composerHeight,
    onSend: onSend,
    onInputSizeChanged: onInputSizeChanged,
    onTextChanged: onInputTextChanged,
    textInputProps: {
      ...textInputProps,
      ref: textInputRef,
      maxLength: maxLength,
    }
  };
  if (isTypingDisabled) {
    inputToolbarProps.textInputProps.maxLength = 0;
  }
  if (renderInputToolbar) return renderInputToolbar(inputToolbarProps);

  return (
    <InputToolbar
      {...inputToolbarProps}
    />
  );
}

function ChatLoading(props) {
  const { renderLoading } = props
  if (renderLoading) return renderLoading();

  return null;
}

export function ChatInitialView(props) {
  const { renderLoading, onLayout } = props
  return (
    <View style={styles.container} onLayout={onLayout}>
      <ChatLoading renderLoading={renderLoading} />
    </View>
  );
}

export function ChatContainer(props) {
  // const { isInitialized, messagesContainerHeight } = this.state;
  // const { textInputProps, maxInputLength, renderInputToolbar, renderLoading } = this.props;
  // if (!isInitialized) return <ChatInitialView renderLoading={renderLoading} onLayout={this.onInitialLayoutViewLayout} />;
  
  // return (
  //   <ActionSheet ref={component => this._actionSheetRef = component}>
  //     <View style={styles.container} onLayout={this.onMainViewLayout}>
  //       <ChatMessages 
  //         {...this.props} 
  //         messagesContainerHeight={messagesContainerHeight} 
  //         invertibleScrollViewProps={this.invertibleScrollViewProps}
  //         messages={this.getMessages()}
  //         messageContainerRef={component => this._messageContainerRef = component}
  //       />
  //       <ChatInputToolbar
  //         {...this.props}
  //         text={this.getTextFromProp(this.state.text)}
  //         composerHeight={Math.max(MIN_COMPOSER_HEIGHT, this.state.composerHeight)}
  //         onSend={this.onSend}
  //         onInputSizeChanged={this.onInputSizeChanged}
  //         onInputTextChanged={this.onInputTextChanged}
  //         textInputProps={{...textInputProps}}
  //         textInputRef={textInput => this.textInput = textInput}
  //         maxLength={this.getIsTypingDisabled() ? 0 : maxInputLength}
  //         isTypingDisabled={this.getIsTypingDisabled()}
  //         renderInputToolbar={renderInputToolbar}
  //       />
  //     </View>
  //   </ActionSheet>
  // );
}