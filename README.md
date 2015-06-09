# Angular API Factory

The angular version of: https://github.com/DiegoZoracKy/AjaxAPIFactory

Gets an object literal with a desired API's structure and based on it, creates a well defined interface to handle ajax calls ($http). Inspired by the jQuery version that i created some time ago:


## The goal

Basically the goal will be stop to writing a lot of the same code:

```javascript
// Product Fetch
$http({
    method: 'GET',
    url: 'https://www.some-domain.com/api/v1/product/fetch',
    params: 'limit=10, sort_by=created:desc'
});

// Product Save
$http({
    method: 'POST',
    url: 'https://www.some-domain.com/api/v1/product/save',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    data: {
        id: 1,
        title: 'New Product Title',
        category: 'some-category'
    }
});

```

into this:

```javascript
Product.fetch();

Product.save({
    id: 1,
    title: 'New Product Title',
    category: 'some-category'
});

```

The first example has more code to make the engine work than meaningful and understandable information about the api communication itself. This module's intention is provide a way to define the API in a structured way that will be easy to maintain, which will serve as a code and almost as a documentation due to its easy reading, e.g.:

## Usage

This is an example of how you can define the API and use the AjaxAPIFactory to create the interface. Look that you can have nested structures and methods.

```javascript
angular.module('myApp').factory('Product', ['ApiFactoryAjax', function(ApiFactoryAjax) {

    return new ApiFactoryAjax({

        save: {
            apiSchema: {
                url: 'https://www.some-domain.com/api/v1/product/save',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                data: {
                    all: ['id', 'title', 'category'],
                    required: ['id', 'title'],
                    defaults: {
                        category: 'Default Category'
                    }
                }
            }
        },

        fetch: {
            apiSchema: {
                url: 'https://www.some-domain.com/api/v1/product/fetch'
            }
        },

        fetchSorted: {
            apiSchema: {
                url: 'https://www.some-domain.com/api/v1/product/fetch',
                method: 'GET',
                data: {
                    all: ['limit', 'sort_by'],
                    defaults: {
                        limit: 10,
                        sort_by: 'created:desc'
                    }
                }
            }
        }
    });
}]);
```

### Now, the object created can be used in this way:

```javascript
angular.module('site').controller('ProductController', ['$scope', 'Product', function($scope, Product) {

    Product.fetch().success(function(response) {
        $scope.productsData = response;
    });

    Product.fetchSorted({
        limit: 50
    }).success(function(response) {
        $scope.productsDataSorted = response;
    });

    // Assuming that this function is called on view, passing a product data (object literal) as a param.
    $scope.loadData = function(product) {
        Product.save(product).success(function(response) {
            console.log('Fetched successfully', response);
        }).error(function(data) {
            console.warn('Don\'t Panic... Maybe is just some required params that is missing');
        });
    };
}]);
```

## Key Behaviors

**Keep in mind that is all \$http after all.** So every method will return a promise as the \$http execution does.

### Required Parameters Validation
All required parameters defined on configuration will be checked by its existence during the method call. So, you don't need to check the validation of params before the execution, leaving the treatment to the **.error** method of the promise.

### Required Parameters Validation and .error
If the required parameters are validated (which is done by default), the **.error** promise will be handled differently, returning an '*Missing required params*' error message along with a list of the required and the current params.

### Nested structure definition
You can define nested properties if you find useful to better describe the API, e.g.:

```javascript
new ApiFactoryAjax({
    image: {
        save: {
            apiSchema: {
                url: 'https://www.some-domain.com/api/v1/product/image/save',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            }
        },

        fetch: {
            apiSchema: {
                url: 'https://www.some-domain.com/api/v1/product/image/fetch',
            }
        }
    }
});
```

Which will result in:

```javascript
Product.image.save();
Product.image.fetch();
```


## Configuring

The object used to construct the API will need some specific data expected by the Angular API Factory.

- **apiSchema (REQUIRED)**

 Each property which will be a method needs to have its api schema defined on it. All the others properties expected by the module should be set on this property.

 **All the following properties should be defined within this one.**

- **url (REQUIRED)**

 The API's endpoint. Without it the interface can't know where a method needs to go.

- **method**

 Even knowing that "$http" default method is GET, i suggest you to write it on the api schema. You can use this object to have a well defined guide of the app's API.

- **data**

    - **defaults**

     You can set default data/parameters for the "$http" call.

    - **required**

     Where the required parameters expected by the api url can be defined. The execution of the method will check for the existence of each one of them. See the *Key Behaviors* section to know the quirks about it and the next property to know how to turn off the automatic validation.

    - **validate**

     When the required parameters should be validated. Defaults to **true**.

    - **all**

     This information doesn't have any effect on the "$http" call or in any part of the API process. This information should be used by the application that will be using the API created by this module. All of the defined API Schema, will be exposed in the property **_schema** that will be found on each method.

- **extendConfig**

 This is a function which will be ran during the method call, but before data validation and $http execution. It will pass the config and data as a parameters so you can modify them if needed. Follows a real use case:

 The endpoint has a structure where some of its parts should be modified based on the current data used during the call, e.g.:

 https://www.some-domain.com/api/v1/product/PRODUCT-ID/save

 For this case, the setup would be something like:
 *Attention for the **{{PRODUCT-ID}}** on url.*

 ```javascript
save: {
    apiSchema: {
        url: 'https://www.some-domain.com/api/v1/product/{{PRODUCT-ID}}/save',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        extendConfig: function(config, data) {
            config.url = config.url.replace('{{PRODUCT-ID}}', data.productID);
        }
    }
}
```

**Bear in mind that any property expected by the $http can be passed here within apiSchema.**