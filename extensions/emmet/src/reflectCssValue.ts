/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Range, window, TextEditor } from 'vscode';
import { isStyleSheet } from 'vscode-emmet-helper';
import { parse, getNode, getCssProperty } from './util';
import { Property, Rule } from 'EmmetNode';

const vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-', ''];

export function reflectCssValue() {
	let editor = window.activeTextEditor;
	if (!editor) {
		window.showInformationMessage('No editor is active.');
		return;
	}

	if (!isStyleSheet(editor.document.languageId)) {
		return;
	}

	const rootNode = parse(editor.document);
	const node = getNode(rootNode, editor.selection.active, true);
	if (!node || node.type !== 'property') {
		return;
	}

	return updateCSSNode(editor, <Property>node);

}

function updateCSSNode(editor: TextEditor, property: Property) {
	const rule: Rule = property.parent;
	let currentPrefix = '';

	// Find vendor prefix of given property node
	for (let i = 0; i < vendorPrefixes.length; i++) {
		if (property.name.startsWith(vendorPrefixes[i])) {
			currentPrefix = vendorPrefixes[i];
			break;
		}
	}

	const propertyName = property.name.substr(currentPrefix.length);
	const propertyValue = property.value;

	return editor.edit(builder => {
		// Find properties with vendor prefixes, update each
		vendorPrefixes.forEach(prefix => {
			if (prefix === currentPrefix) {
				return;
			}
			let vendorProperty = getCssProperty(rule, prefix + propertyName);
			if (vendorProperty) {
				builder.replace(new Range(vendorProperty.valueToken.start, vendorProperty.valueToken.end), propertyValue);
			}
		});
	});
}