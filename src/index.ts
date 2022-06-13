import { Command, ExternalCommand, ICommandDescriptor } from './command';
import { ApiRef, IContribution, PackageJson } from './common';
import { ContextKey } from './contextKey';
import { Menu } from './menu';

export * from './command';
export { ThemeMap } from './common';

export class Contributions {
  private readonly api = new ApiRef();
  private readonly contributions: IContribution[] = [];

  /**
   * Creates a VS Code command.
   */
  public command<TArgs extends unknown[]>(options: ICommandDescriptor) {
    return <TReturnType = void>() => {
      const command = new Command<TArgs, TReturnType>(this.api, options);
      this.contributions.push(command);
      return command;
    };
  }

  /**
   * Creates an external command that is callable, but cannot be registered.
   */
  public externalCommand<TArgs extends unknown[]>(id: string) {
    return <TReturnType = void>() => new ExternalCommand<TArgs, TReturnType>(this.api, id);
  }

  /**
   * Creates a new context key of the given type.
   */
  public contextKey<T>(key: string) {
    return new ContextKey<T>(this.api, key);
  }

  /**
   * Creates a new menu reference.
   */
  public menu(id: string) {
    const menu = new Menu(id);
    this.contributions.push(menu);
    return menu;
  }

  /**
   * Asserts all contributions were registered in the extension.
   */
  public assertRegistered() {
    const missing = this.contributions.filter(c => !c.isRegistered);
    if (!missing.length) {
      return;
    }

    const msg = `One or more contributions were not registered: ${missing.join(', ')}`;
    if (this.api.value) {
      this.api.value.window.showErrorMessage(msg);
    } else {
      throw new Error(msg);
    }
  }

  /**
   * Serializes all registered contributions to JSON.
   */
  public toJSON() {
    const pjson = new PackageJson();
    for (const contribution of this.contributions) {
      contribution.contribute(pjson);
    }
    return pjson.toJSON();
  }
}
