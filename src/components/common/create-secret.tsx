import * as React from 'react';
import { WithT } from 'i18next';
import { withTranslation } from 'react-i18next';
import { DroppableFileInput } from './file-input';
import _ from 'lodash';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import {
  Button,
  FormGroup,
  TextInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { Base64 } from 'js-base64';

const AUTHS_KEY = 'auths';

type BasicAuthSubformProps = {
  onChange: Function;
  stringData: {
    [key: string]: string;
  };
};

export type BasicAuthSubformState = {
  username: string;
  password: string;
};

type SSHAuthSubformProps = {
  onChange: Function;
  stringData: {
    [key: string]: string;
  };
};

type SSHAuthSubformState = {
  'ssh-privatekey': string;
};

class BasicAuthSubformWithTranslation extends React.Component<
  BasicAuthSubformProps & WithT,
  BasicAuthSubformState
> {
  constructor(props) {
    super(props);
    this.state = {
      username: this.props.stringData.username || '',
      password: this.props.stringData.password || '',
    };
  }

  render() {
    const { t } = this.props;
    return (
      <>
        <FormGroup
          label={t('plugin__pipelines-console-plugin~Username')}
          fieldId="username"
          className="form-group"
        >
          <TextInput
            id="username"
            type="text"
            name="username"
            value={this.state.username}
            onChange={(_event, value) => {
              this.setState({ username: value }, () =>
                this.props.onChange(this.state),
              );
            }}
            aria-describedby="username-help"
            data-test="secret-username"
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem id="username-help">
                {t(
                  'plugin__pipelines-console-plugin~Optional username for Git authentication.',
                )}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <FormGroup
          label={t('plugin__pipelines-console-plugin~Password or token')}
          isRequired
          fieldId="password"
          className="form-group"
        >
          <TextInput
            id="password"
            type="password"
            name="password"
            value={this.state.password}
            onChange={(_event, value) => {
              this.setState({ password: value }, () =>
                this.props.onChange(this.state),
              );
            }}
            aria-describedby="password-help"
            data-test="secret-password"
            isRequired
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem id="password-help">
                {t(
                  'plugin__pipelines-console-plugin~Password or token for Git authentication. Required if a ca.crt or .gitconfig file is not specified.',
                )}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </>
    );
  }
}

export const BasicAuthSubform = withTranslation()(
  BasicAuthSubformWithTranslation,
);

class SSHAuthSubformWithTranslation extends React.Component<
  SSHAuthSubformProps & WithT,
  SSHAuthSubformState
> {
  constructor(props) {
    super(props);
    this.state = {
      'ssh-privatekey': this.props.stringData['ssh-privatekey'] || '',
    };
    this.changeData = this.changeData.bind(this);
    this.onFileChange = this.onFileChange.bind(this);
  }
  changeData(event) {
    this.setState(
      {
        'ssh-privatekey': event.target.value.endsWith('\n')
          ? event.target.value
          : `${event.target.value}\n`,
      },
      () => this.props.onChange(this.state),
    );
  }
  onFileChange(fileData) {
    this.setState(
      {
        'ssh-privatekey': fileData.endsWith('\n') ? fileData : `${fileData}\n`,
      },
      () => this.props.onChange(this.state),
    );
  }
  render() {
    const { t } = this.props;
    return (
      <DroppableFileInput
        onChange={this.onFileChange}
        inputFileData={this.state['ssh-privatekey']}
        id="ssh-privatekey"
        label={t('plugin__pipelines-console-plugin~SSH private key')}
        inputFieldHelpText={t(
          'plugin__pipelines-console-plugin~Drag and drop file with your private SSH key here or browse to upload it.',
        )}
        textareaFieldHelpText={t(
          'plugin__pipelines-console-plugin~Private SSH key file for Git authentication.',
        )}
        isRequired={true}
      />
    );
  }
}

export const SSHAuthSubform = withTranslation()(SSHAuthSubformWithTranslation);

type ConfigEntryFormState = {
  address: string;
  username: string;
  password: string;
  email: string;
  auth: string;
  uid: string;
};

type ConfigEntryFormProps = {
  id: number;
  entry: Object;
  onChange: Function;
};

class ConfigEntryFormWithTranslation extends React.Component<
  ConfigEntryFormProps & WithT,
  ConfigEntryFormState
> {
  constructor(props) {
    super(props);
    this.state = {
      address: _.get(this.props.entry, 'address'),
      username: _.get(this.props.entry, 'username'),
      password: _.get(this.props.entry, 'password'),
      email: _.get(this.props.entry, 'email'),
      auth: _.get(this.props.entry, 'auth'),
      uid: _.get(this.props, 'uid'),
    };
  }

  propagateChange = () => {
    const { onChange, id } = this.props;
    onChange(this.state, id);
  };

  onUsernameChanged = (event: any) => {
    const username = event.currentTarget?.value || event;
    this.setState(
      (state: ConfigEntryFormState) => ({
        username,
        auth: Base64.encode(`${username}:${state.password}`),
      }),
      this.propagateChange,
    );
  };

  onPasswordChanged = (event: any) => {
    const password = event.currentTarget?.value || event;
    this.setState(
      (state: ConfigEntryFormState) => ({
        password,
        auth: Base64.encode(`${state.username}:${password}`),
      }),
      this.propagateChange,
    );
  };

  onBlurHandler: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget;
    this.setState(
      (prevState) => ({
        ...prevState,
        [name]: value.trim(),
      }),
      this.propagateChange,
    );
  };

  render() {
    const { t } = this.props;

    return (
      <div
        className="co-m-pane__body-group"
        data-test-id="create-image-secret-form"
      >
        <FormGroup
          label={t('plugin__pipelines-console-plugin~Registry server address')}
          isRequired
          fieldId={`${this.props.id}-address`}
          className="form-group"
        >
          <TextInput
            id={`${this.props.id}-address`}
            type="text"
            name="address"
            value={this.state.address}
            onChange={(_event, value) => {
              this.setState({ address: value }, this.propagateChange);
            }}
            onBlur={this.onBlurHandler}
            aria-describedby={`${this.props.id}-address-help`}
            data-test="image-secret-address"
            isRequired
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem id={`${this.props.id}-address-help`}>
                {t(
                  'plugin__pipelines-console-plugin~For example quay.io or docker.io',
                )}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <FormGroup
          label={t('plugin__pipelines-console-plugin~Username')}
          isRequired
          fieldId={`${this.props.id}-username`}
          className="form-group"
        >
          <TextInput
            id={`${this.props.id}-username`}
            type="text"
            name="username"
            value={this.state.username}
            onChange={(_event, value) => this.onUsernameChanged(value)}
            onBlur={this.onBlurHandler}
            data-test="image-secret-username"
            isRequired
          />
        </FormGroup>
        <FormGroup
          label={t('plugin__pipelines-console-plugin~Password')}
          isRequired
          fieldId={`${this.props.id}-password`}
          className="form-group"
        >
          <TextInput
            id={`${this.props.id}-password`}
            type="password"
            name="password"
            value={this.state.password}
            onChange={(_event, value) => this.onPasswordChanged(value)}
            onBlur={this.onBlurHandler}
            data-test="image-secret-password"
            isRequired
          />
        </FormGroup>
        <FormGroup
          label={t('plugin__pipelines-console-plugin~Email')}
          fieldId={`${this.props.id}-email`}
          className="form-group"
        >
          <TextInput
            id={`${this.props.id}-email`}
            type="text"
            name="email"
            value={this.state.email}
            onChange={(_event, value) => {
              this.setState({ email: value }, this.propagateChange);
            }}
            onBlur={this.onBlurHandler}
            data-test="image-secret-email"
          />
        </FormGroup>
      </div>
    );
  }
}

export const ConfigEntryForm = withTranslation()(
  ConfigEntryFormWithTranslation,
);

type CreateConfigSubformState = {
  isDockerconfigjson: boolean;
  hasDuplicate: boolean;
  secretEntriesArray: {
    entry: {
      address: string;
      username: string;
      password: string;
      email: string;
      auth: string;
    };
    uid: string;
  }[];
};

type CreateConfigSubformProps = {
  onChange: Function;
  stringData: {
    [key: string]: any;
  };
};

class CreateConfigSubformWithTranslation extends React.Component<
  CreateConfigSubformProps & WithT,
  CreateConfigSubformState
> {
  constructor(props) {
    super(props);
    this.state = {
      // If user creates a new image secret by filling out the form a 'kubernetes.io/dockerconfigjson' secret will be created.
      isDockerconfigjson:
        _.isEmpty(this.props.stringData) || !!this.props.stringData[AUTHS_KEY],
      secretEntriesArray: this.imageSecretObjectToArray(
        this.props.stringData?.[AUTHS_KEY] || this.props.stringData,
      ),
      hasDuplicate: false,
    };
    this.onDataChanged = this.onDataChanged.bind(this);
  }
  newImageSecretEntry() {
    return {
      entry: {
        address: '',
        username: '',
        password: '',
        email: '',
        auth: '',
      },
      uid: _.uniqueId(),
    };
  }
  imageSecretObjectToArray(imageSecretObject) {
    const imageSecretArray = [];
    if (_.isEmpty(imageSecretObject)) {
      return _.concat(imageSecretArray, this.newImageSecretEntry());
    }
    _.each(imageSecretObject, (v, k) => {
      // Decode and parse 'auth' in case 'username' and 'password' are not part of the secret.
      const decodedAuth = Base64.decode(_.get(v, 'auth', ''));
      const parsedAuth = _.isEmpty(decodedAuth)
        ? _.fill(Array(2), '')
        : _.split(decodedAuth, ':');
      imageSecretArray.push({
        entry: {
          address: k,
          username: _.get(v, 'username', parsedAuth[0]),
          password: _.get(v, 'password', parsedAuth[1]),
          email: _.get(v, 'email', ''),
          auth: _.get(v, 'auth', ''),
        },
        uid: _.get(v, 'uid', _.uniqueId()),
      });
    });
    return imageSecretArray;
  }
  imageSecretArrayToObject(imageSecretArray) {
    const imageSecretsObject = {};
    _.each(imageSecretArray, (value) => {
      imageSecretsObject[value.entry.address] = _.pick(value.entry, [
        'username',
        'password',
        'auth',
        'email',
      ]);
    });
    return imageSecretsObject;
  }
  propagateEntryChange(secretEntriesArray) {
    const imageSecretObject = this.imageSecretArrayToObject(secretEntriesArray);
    this.props.onChange(
      this.state.isDockerconfigjson
        ? { [AUTHS_KEY]: imageSecretObject }
        : imageSecretObject,
    );
  }
  onDataChanged(updatedEntry, entryIndex: number) {
    this.setState(
      (state: CreateConfigSubformState) => {
        const secretEntriesArray = [...state.secretEntriesArray];
        const updatedEntryData = {
          uid: secretEntriesArray[entryIndex].uid,
          entry: updatedEntry,
        };
        secretEntriesArray[entryIndex] = updatedEntryData;
        return {
          secretEntriesArray,
        };
      },
      () => this.propagateEntryChange(this.state.secretEntriesArray),
    );
  }
  removeEntry(entryIndex: number) {
    this.setState(
      (state: CreateConfigSubformState) => {
        const secretEntriesArray = [...state.secretEntriesArray];
        secretEntriesArray.splice(entryIndex, 1);
        return { secretEntriesArray };
      },
      () => this.propagateEntryChange(this.state.secretEntriesArray),
    );
  }
  addEntry() {
    this.setState(
      {
        secretEntriesArray: _.concat(
          this.state.secretEntriesArray,
          this.newImageSecretEntry(),
        ),
      },
      () => {
        this.propagateEntryChange(this.state.secretEntriesArray);
      },
    );
  }
  render() {
    const { t } = this.props;
    const secretEntriesList = _.map(
      this.state.secretEntriesArray,
      (entryData, index) => {
        return (
          <div className="co-add-remove-form__entry" key={entryData.uid}>
            {_.size(this.state.secretEntriesArray) > 1 && (
              <div className="co-add-remove-form__link--remove-entry">
                <Button
                  onClick={() => this.removeEntry(index)}
                  type="button"
                  variant="link"
                  data-test="remove-entry-button"
                >
                  <MinusCircleIcon className="co-icon-space-r" />
                  {t('plugin__pipelines-console-plugin~Remove credentials')}
                </Button>
              </div>
            )}
            <ConfigEntryForm
              id={index}
              entry={entryData.entry}
              onChange={this.onDataChanged}
            />
          </div>
        );
      },
    );
    return (
      <>
        {secretEntriesList}
        <Button
          className="co-create-secret-form__link--add-entry pf-m-link--align-left"
          onClick={() => this.addEntry()}
          type="button"
          variant="link"
          data-test="add-credentials-button"
        >
          <PlusCircleIcon className="co-icon-space-r" />
          {t('plugin__pipelines-console-plugin~Add credentials')}
        </Button>
      </>
    );
  }
}

export const CreateConfigSubform = withTranslation()(
  CreateConfigSubformWithTranslation,
);
