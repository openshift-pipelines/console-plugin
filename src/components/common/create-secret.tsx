import * as React from 'react';
import { WithT } from 'i18next';
import { withTranslation } from 'react-i18next';
import { DroppableFileInput } from './file-input';
import _ from 'lodash';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
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
    this.changeData = this.changeData.bind(this);
  }
  changeData(event) {
    this.setState(
      {
        [event.target.name]: event.target.value,
      } as BasicAuthSubformState,
      () => this.props.onChange(this.state),
    );
  }

  render() {
    const { t } = this.props;
    return (
      <>
        <div className="form-group">
          <label className="control-label" htmlFor="username">
            {t('plugin__pipelines-console-plugin~Username')}
          </label>
          <div>
            <input
              className="pf-v6-c-form-control"
              id="username"
              data-test="secret-username"
              aria-describedby="username-help"
              type="text"
              name="username"
              onChange={this.changeData}
              value={this.state.username}
            />
            <p className="help-block" id="username-help">
              {t(
                'plugin__pipelines-console-plugin~Optional username for Git authentication.',
              )}
            </p>
          </div>
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="password">
            {t('plugin__pipelines-console-plugin~Password or token')}
          </label>
          <div>
            <input
              className="pf-v6-c-form-control"
              id="password"
              data-test="secret-password"
              aria-describedby="password-help"
              type="password"
              name="password"
              onChange={this.changeData}
              value={this.state.password}
              required
            />
            <p className="help-block" id="password-help">
              {t(
                'plugin__pipelines-console-plugin~Password or token for Git authentication. Required if a ca.crt or .gitconfig file is not specified.',
              )}
            </p>
          </div>
        </div>
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

  onAddressChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ address: event.currentTarget.value }, this.propagateChange);
  };

  onUsernameChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const username = event.currentTarget.value;
    this.setState(
      (state: ConfigEntryFormState) => ({
        username,
        auth: Base64.encode(`${username}:${state.password}`),
      }),
      this.propagateChange,
    );
  };

  onPasswordChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const password = event.currentTarget.value;
    this.setState(
      (state: ConfigEntryFormState) => ({
        password,
        auth: Base64.encode(`${state.username}:${password}`),
      }),
      this.propagateChange,
    );
  };

  onEmailChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ email: event.currentTarget.value }, this.propagateChange);
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
        <div className="form-group">
          <label
            className="control-label co-required"
            htmlFor={`${this.props.id}-address`}
          >
            {t('plugin__pipelines-console-plugin~Registry server address')}
          </label>
          <div>
            <input
              className="pf-v6-c-form-control"
              id={`${this.props.id}-address`}
              aria-describedby={`${this.props.id}-address-help`}
              type="text"
              name="address"
              onChange={this.onAddressChanged}
              value={this.state.address}
              onBlur={this.onBlurHandler}
              data-test="image-secret-address"
              required
            />
          </div>
          <p className="help-block" id={`${this.props.id}-address-help`}>
            {t(
              'plugin__pipelines-console-plugin~For example quay.io or docker.io',
            )}
          </p>
        </div>
        <div className="form-group">
          <label
            className="control-label co-required"
            htmlFor={`${this.props.id}-username`}
          >
            {t('plugin__pipelines-console-plugin~Username')}
          </label>
          <div>
            <input
              className="pf-v6-c-form-control"
              id={`${this.props.id}-username`}
              type="text"
              name="username"
              onChange={this.onUsernameChanged}
              value={this.state.username}
              onBlur={this.onBlurHandler}
              data-test="image-secret-username"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label
            className="control-label co-required"
            htmlFor={`${this.props.id}-password`}
          >
            {t('plugin__pipelines-console-plugin~Password')}
          </label>
          <div>
            <input
              className="pf-v6-c-form-control"
              id={`${this.props.id}-password`}
              type="password"
              name="password"
              onChange={this.onPasswordChanged}
              value={this.state.password}
              onBlur={this.onBlurHandler}
              data-test="image-secret-password"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor={`${this.props.id}-email`}>
            {t('plugin__pipelines-console-plugin~Email')}
          </label>
          <div>
            <input
              className="pf-v6-c-form-control"
              id={`${this.props.id}-email`}
              type="text"
              name="email"
              onChange={this.onEmailChanged}
              value={this.state.email}
              onBlur={this.onBlurHandler}
              data-test="image-secret-email"
            />
          </div>
        </div>
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
                  icon={<MinusCircleIcon className="co-icon-space-r" />}
                  onClick={() => this.removeEntry(index)}
                  type="button"
                  variant="link"
                  data-test="remove-entry-button"
                >
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
          icon={<PlusCircleIcon className="co-icon-space-r" />}
          className="co-create-secret-form__link--add-entry pf-m-link--align-left"
          onClick={() => this.addEntry()}
          type="button"
          variant="link"
          data-test="add-credentials-button"
        >
          {t('plugin__pipelines-console-plugin~Add credentials')}
        </Button>
      </>
    );
  }
}

export const CreateConfigSubform = withTranslation()(
  CreateConfigSubformWithTranslation,
);
