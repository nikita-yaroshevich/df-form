(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('df.form.config', [])
      .value('df.form.config', {
          debug: true
      });

  // Modules
  angular.module('df.form.directive', []);
  angular.module('df.form.service', []);
  angular.module('df.form',
      [
          'df.form.config',
          'df.form.directive',
          'df.form.service',
          'df.validator',
          'ngSanitize'
      ]);

})(angular);
