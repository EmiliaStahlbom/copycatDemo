// const sectraConfig = require('@sectra/eslint-config-typescript');

const indentOptions = {
    "SwitchCase": 1,
    ignoredNodes: ['JSXElement', 'JSXElement > *', 'JSXAttribute', 'JSXIdentifier', 'JSXNamespacedName', 'JSXMemberExpression', 'JSXSpreadAttribute', 'JSXExpressionContainer', 'JSXOpeningElement', 'JSXClosingElement', 'JSXFragment', 'JSXOpeningFragment', 'JSXClosingFragment', 'JSXText', 'JSXEmptyExpression', 'JSXSpreadChild'],
}

module.exports = {
  // extends: [
  //   '@sectra/eslint-config-typescript'
  // ],
  parserOptions: {
    project: "./tsconfig.json",
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    // Airbnb style uses 2 spaces, override and use 4 instead
    "indent": ["error", 4, indentOptions],
    "react/jsx-indent": ["error", 4],
    "react/jsx-indent-props": ["error", 4],
    "@typescript-eslint/indent": ["error", 4, indentOptions],

    // Most people on our team are used to c# and use double quotes.
    "@typescript-eslint/quotes": [
        "error",
        "double",
        {
          "avoidEscape": true
        }
    ],
	
	// An unused variable may be very important if we have a rest-sibling
	"no-unused-vars": ["error", { "ignoreRestSiblings": true }],
    
    // This just causes irritation that you can't put 
    // your type definitions where you want them.
    "@typescript-eslint/no-use-before-define": "off",

    // This is rules for good accessibility, these are good so we should 
    // probably fix them some time.
    "jsx-a11y/click-events-have-key-events": "off",
    "jsx-a11y/no-static-element-interactions": "off",

    // We think the purpose of switch-case is partly to allow fallthrough
    "no-fallthrough": "off"
  }
};
