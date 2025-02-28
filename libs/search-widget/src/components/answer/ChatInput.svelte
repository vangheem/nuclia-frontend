<script lang="ts">
  import { Subscription, filter } from 'rxjs';
  import { onMount } from 'svelte';
  import { SpeechSettings, SpeechStore } from 'talk2svelte';
  import IconButton from '../../common/button/IconButton.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import { _ } from '../../core/i18n';
  import { isSpeechOn } from '../../core/stores/answers.store';
  import { ask } from '../../core/stores/effects';
  import { isSpeechEnabled } from '../../core/stores/widget.store';
  export let placeholder = '';

  let inputElement: HTMLInputElement;
  let question = '';
  let isListening = false;
  const subs: Subscription[] = [];
  const isSpeechStarted = SpeechStore.isStarted;

  function toggleSpeech() {
    isSpeechOn.set({ toggle: true });
  }

  onMount(() => {
    subs.push(
      isSpeechEnabled.subscribe((enabled) => {
        if (enabled) {
          SpeechSettings.declareCommand('question');
          SpeechSettings.declareCommand('search');
        }
      }),
    );
    subs.push(
      SpeechStore.currentCommand
        .pipe(filter((command) => command === 'question'))
        .subscribe(() => (isListening = true)),
    );
    subs.push(
      SpeechStore.currentCommand.pipe(filter((command) => command === 'search')).subscribe(() => {
        isListening = false;
        askQuestion();
      }),
    );
    subs.push(SpeechStore.message.pipe(filter(() => isListening)).subscribe((message: string) => (question = message)));

    return () => {
      SpeechSettings.removeCommand('question');
      SpeechSettings.removeCommand('search');
      subs.map((sub) => sub.unsubscribe());
    };
  });
  const askQuestion = () => {
    ask.next({ question, reset: false });
    question = '';
    if ((navigator as any).userAgentData?.mobile) {
      // Make sure the keyboard disappear when triggering search in Mobile
      inputElement.blur();
    }
  };

  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      askQuestion();
    }
  };
</script>

<div
  class="sw-chat-input"
  class:highlight={isListening}>
  <div class="icon">
    <Icon name="chat" />
  </div>
  <input
    name="nuclia-chat-field"
    bind:this={inputElement}
    {placeholder}
    tabindex="0"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label={$_('answer.input.label')}
    bind:value={question}
    on:keypress={onKeyPress} />
  {#if $isSpeechEnabled}
    <div class="microphone">
      <IconButton
        icon="microphone"
        active={$isSpeechStarted}
        aspect="basic"
        on:click={toggleSpeech} />
    </div>
  {/if}
</div>

<style
  lang="scss"
  src="./ChatInput.scss"></style>
