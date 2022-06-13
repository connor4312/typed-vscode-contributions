import { Command } from './command';
import { IContribution, PackageJson } from './common';
import { IContextKeyExpression } from './contextKey';

export interface IMenuItemDescriptor {
  command: Command<any, any>;
  alt?: Command<any, any>;
  when?: string | IContextKeyExpression;
}

export class Menu implements IContribution {
  public readonly isRegistered = true;

  private items: {
    command: string;
    alt?: string;
    when?: string;
    group?: string;
  }[] = [];

  constructor(public readonly id: string) {}

  /**
   * Adds multiple items to a group in the menu.
   */
  public group(groupName: string, items: readonly IMenuItemDescriptor[]) {
    this.items = this.items.concat(
      items.map(item => ({
        command: item.command.descriptor.id,
        alt: item.alt?.descriptor.id,
        when: typeof item.when === 'object' ? item.when.compile() : item.when,
        group: groupName,
      })),
    );
  }

  /**
   * Adds an item to the menu.
   */
  public add(item: IMenuItemDescriptor) {
    this.items.push({
      command: item.command.descriptor.id,
      alt: item.alt?.descriptor.id,
      when: typeof item.when === 'object' ? item.when.compile() : item.when,
    });
  }

  /** @inheritdoc */
  public contribute({ contributions }: PackageJson): void {
    contributions.menus ??= {};
    contributions.menus[this.id] ??= [];
    contributions.menus[this.id].push(...this.items);
  }
}
