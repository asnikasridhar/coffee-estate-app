global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('./src/components/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ name }) => React.createElement(Text, null, name);
});
