const Platform = {
  OS: 'android', // or 'ios' as needed
  select: (specifics) => specifics[Platform.OS] || specifics.default,
};
module.exports = Platform;
