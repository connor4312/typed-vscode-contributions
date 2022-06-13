import type * as vscode from 'vscode';

export interface ThemeMap<T> {
  light?: T;
  dark?: T;
  highContrast?: T;
  highContrastDark?: T;
}

export class ApiRef {
  public value?: typeof vscode;

  public set(api: typeof vscode) {
    this.value = api;
  }

  public get() {
    if (!this.value) {
      throw new Error(`Cannot use the vscode API before calling contributions.attach(vscode)`);
    }

    return this.value;
  }
}

export interface IContribution {
  readonly isRegistered: boolean;
  contribute(packageJson: PackageJson): void;
}

export class PackageJson {
  public readonly activationEvents = new Set<string>();
  public readonly contributions: {
    commands?: {
      command: string;
      title?: string;
      category?: string;
      icon?: string | ThemeMap<string>;
    }[];
    menus?: {
      [key: string]: {
        command: string;
        alt?: string;
        when?: string;
        group?: string;
      }[];
    };
  } = {};

  public toJSON() {
    return {
      activationEvents: this.activationEvents,
      contributions: this.contributions,
    };
  }
}
