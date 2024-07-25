document.addEventListener('alpine:init', () => {
    Alpine.data('pizzaCart', () => {
        return {
            title: 'Pizza Cart API',
            pizzas: [],
            username: '',
            cartId: '',
            cartPizzas: [],
            cartTotal: 0.00,
            change: 0,
            paymentAmount: 0.00,
            message: '',


            login() {
                if (this.username.length > 1) { //if the username has more than 1 letter they should be able to create a cart
                    this.createCart();
                } else {
                    alert("Invalid Username");
                }
            },
            logout() {
                if (confirm('Confirm Logout?')) {
                    this.username = '';
                    this.cartId = '';
                    localStorage.removeItem('cartId');//when you want to logout it removes all items
                }
            },

            
            createCart() {
                if (!this.username) {
                    this.cartId = 'Invalid input entered';
                    return Promise.resolve()
                }
                
                const cartId = localStorage.getItem('cartId');
                
                if (cartId) {
                    this.cartId = cartId;
                    return Promise.resolve() //if cartId is readily available the function will retuen a promise, avoiding the use of asynchronous functions
                } else {
                    const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
                    return axios.get(createCartURL) //otherwise just get the username from local storage
                        .then(result => {
                            this.cartId = result.data.cart_code;
                            localStorage.setItem('cartId', this.cartId);
                        });
                }
            },
            getCart() { //get is to extract data from server and display on webpage
                const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cartId}/get`;//be careful that one getCart has a lowercase g and one an upper case G
                return axios.get(getCartURL);
            },
            addPizza(pizzaId) { //post is submit data to be processed by server
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                });
            },
            removePizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                });
            },
            pay(amount) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                    "cart_code": this.cartId,
                    "amount": parseFloat(amount).toFixed(2)
                });
            },
            
            payForCart() {
                this
                .pay(this.paymentAmount)
                .then(result => {
                    if (result.data.status === 'failure') {
                        this.message = result.data.message;
                    } else {
                        const change = this.paymentAmount - this.cartTotal; //how to calculate the change
                        this.message = `Payment Success, your change is R${change.toFixed(2)}. Have a lovely day!`;
                        this.showCartData(); 
                        setTimeout(() => {
                            this.message = '';
                            this.cartPizzas = [];
                            this.cartTotal = '0.00';
                            this.cartId = '';
                            localStorage.removeItem('cartId'); 
                            this.createCart(); 
                            this.paymentAmount = 0.00;
                        }, 4000);
                    }
                });
            },

           
            showCartData() {
                //this.cartPizzas=result.data.pizzas
                this.getCart().then(result => {
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas.map(pizza => {//use this as a route to find the pizza value from the API
                        return {
                            ...pizza,
                            price: parseFloat(pizza.price).toFixed(2),
                            total: (parseFloat(pizza.price) * pizza.qty).toFixed(2)//parsefloat converts whole number into a decimal
                    //alert(this.cartTotal);

                        }; 
                    });
                    this.cartTotal = parseFloat(cartData.total).toFixed(2);
                }).catch(error => {
                    console.error('Error fetching cart data:', error);
                }); //want to avoid errors in your cart
            },
            init() { //always keep in intialize file in order to work
                this.username = localStorage.getItem('username') || ''; //indicates that all info we collecting from local storage aka js.file
                const cartId = localStorage.getItem('cartId');
                if (cartId) {
                    this.cartId = cartId;
                    this.showCartData();
                }
                axios
                    .get('https://pizza-api.projectcodex.net/api/pizzas')
                    .then(result => {
                        this.pizzas = result.data.pizzas.map(pizza => {
                            return {
                                ...pizza,
                                price: parseFloat(pizza.price).toFixed(2)
                            };
                        });
                    });
            },
            addPizzaToCart(pizzaId) {
                this.addPizza(pizzaId).then(() => {
                    this.showCartData(); 
                });
            },
            removePizzaFromCart(pizzaId) {
                this.removePizza(pizzaId).then(() => {
                    this.showCartData();  
                });
            }
        };
    });
});