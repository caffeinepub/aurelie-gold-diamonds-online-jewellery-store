import Int "mo:core/Int";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Stripe "stripe/stripe";

import Migration "migration";

(with migration = Migration.run)
actor {
  type OrderId = Nat;
  type ProductId = Nat;
  type CustomerId = Principal.Principal;
  type VisitId = Nat;
  type DownloadId = Nat;

  // Jewelry Category
  type ProductCategory = {
    #ring;
    #headpiece;
    #bracelet;
    #diamond;
  };

  // Material type (Gold types)
  type Material = {
    #_22K_gold;
    #_18K_gold;
    #_9K_gold;
  };

  // Product record
  public type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : ProductCategory;
    material : Material;
    stock : Nat;
    images : [Storage.ExternalBlob];
  };

  module Product {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      Int.compare(product1.price, product2.price);
    };
  };

  // Cart item
  public type CartItem = {
    productId : Nat;
    quantity : Nat;
  };

  // Cart
  public type Cart = {
    items : [CartItem];
  };

  // Order status
  public type OrderStatus = {
    #pending;
    #completed;
    #cancelled;
    #shipped;
    #delivered;
  };

  // Customer data
  public type CustomerProfile = {
    id : Principal.Principal;
    name : Text;
    email : Text;
    address : Text;
    phone : Text;
  };

  // Business Contact Information
  public type BusinessContactInfo = {
    storeName : Text;
    storeAddress : Text;
    email : Text;
    phone : Text;
    description : Text;
    gstNumber : Text;
    bankAccount : Text;
    ifscCode : Text;
  };

  // Order record and item
  public type OrderItem = {
    productId : ProductId;
    quantity : Nat;
    price : Nat;
  };

  module OrderItem {
    public func compare(orderItem1 : OrderItem, orderItem2 : OrderItem) : Order.Order {
      Int.compare(orderItem1.price, orderItem2.price);
    };
  };

  public type Order = {
    id : OrderId;
    customerId : CustomerId;
    items : [OrderItem];
    totalAmount : Nat;
    status : OrderStatus;
    createdAt : Int;
  };

  public type OrderWithCustomerDetails = {
    order : Order;
    customer : CustomerProfile;
    isNew : Bool;
    lastStatusUpdate : Int;
  };

  // System state (must be persistent)
  let products = Map.empty<ProductId, Product>();
  var nextProductId = 1;

  let customers = Map.empty<CustomerId, CustomerProfile>();
  let orders = Map.empty<OrderId, Order>();
  var nextOrderId = 1;

  let carts = Map.empty<CustomerId, Cart>();
  let newOrders = Map.empty<OrderId, Bool>();
  let adminEmails = Map.empty<Principal.Principal, Text>();

  type InventoryUpdate = {
    productId : ProductId;
    stock : Nat;
  };

  // Default contact info
  var contactInfo : BusinessContactInfo = {
    storeName = "Aurelie Gold & Diamonds";
    storeAddress = "Bengaluru, India";
    email = "aureliegolddiamondsjewellery@gmail.com";
    phone = "7353264007";
    description = "Aurelie Gold & Diamonds specializes in high-quality gold and diamond jewellery, offering a wide range of products to suit every taste and occasion. Our collections feature exquisite rings, necklaces, bracelets, and more, crafted with precision and attention to detail. We are committed to providing exceptional customer service and ensuring a seamless shopping experience for our valued customers.";
    gstNumber = "GSTRXXXXXXXXX";
    bankAccount = "1234567890";
    ifscCode = "ABC123456";
  };

  // Logo Management
  var logoCounter = 0;
  public type Logo = {
    id : Nat;
    image : Storage.ExternalBlob;
    uploadTimestamp : Int;
    version : Nat;
  };
  var currentLogo : ?Logo = null;

  // Persistent stores for IDs
  var nextVisitId = 0;
  var nextDownloadId = 0;

  public type Visit = {
    id : VisitId;
    timestamp : Int;
    page : Text;
    browser : Text;
    device : Text;
    location : Text;
    sessionId : Text;
  };

  public type Download = {
    id : DownloadId;
    timestamp : Int;
    browser : Text;
    device : Text;
    platform : Text;
    version : Text;
    location : Text;
    sessionId : Text;
  };

  let visits = Map.empty<VisitId, Visit>();
  let downloads = Map.empty<DownloadId, Download>();

  // Core public/private access enforcement
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // User Profile (required by frontend)
  public type UserProfile = {
    name : Text;
    email : Text;
    address : Text;
    phone : Text;
  };
  let userProfiles = Map.empty<Principal.Principal, UserProfile>();

  // Admin email management
  public query ({ caller }) func isAdminEmailLookup(principal : Principal.Principal) : async Bool {
    adminEmails.containsKey(principal);
  };

  public shared ({ caller }) func assignAdminWithEmail(user : Principal.Principal, _email : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only existing admins can assign admin roles");
    };
    adminEmails.add(user, _email);
    AccessControl.assignRole(accessControlState, caller, user, #admin);
  };

  // Public contact info
  public query func getContactInfo() : async BusinessContactInfo {
    contactInfo;
  };

  public shared ({ caller }) func updateContactInfo(newContactInfo : BusinessContactInfo) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update contact info");
    };
    contactInfo := newContactInfo;
  };

  // Logo management
  public query func getCurrentLogo() : async ?Logo {
    currentLogo;
  };

  public shared ({ caller }) func updateCurrentLogo(image : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update logo");
    };

    let newLogo : Logo = {
      id = logoCounter;
      image;
      uploadTimestamp = Time.now();
      version = logoCounter;
    };
    currentLogo := ?newLogo;
    logoCounter += 1;
  };

  public shared ({ caller }) func revertToPreviousLogo() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can revert logo");
    };
    currentLogo := null;
  };

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal.Principal) : async ?UserProfile {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
        Runtime.trap("Unauthorized: Only authenticated users can view profiles");
      };
      if (caller != user) {
        Runtime.trap("Unauthorized: Can only view your own profile");
      };
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Product management
  public shared ({ caller }) func addProduct(name : Text, description : Text, price : Nat, category : ProductCategory, material : Material, stock : Nat, images : [Storage.ExternalBlob]) : async ProductId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };

    let productId = nextProductId;
    nextProductId += 1;

    let product : Product = {
      id = productId;
      name;
      description;
      price;
      category;
      material;
      stock;
      images;
    };
    products.add(productId, product);
    productId;
  };

  public shared ({ caller }) func updateProduct(productId : ProductId, name : Text, description : Text, price : Nat, category : ProductCategory, material : Material, stock : Nat, images : [Storage.ExternalBlob]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        let product : Product = {
          id = productId;
          name;
          description;
          price;
          category;
          material;
          stock;
          images;
        };
        products.add(productId, product);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : ProductId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };

    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        products.remove(productId);
      };
    };
  };

  // Public product queries
  public query func getProduct(productId : ProductId) : async Product {
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  public query func filterProductsByCategory(category : ProductCategory) : async [Product] {
    let filtered = products.values().toArray().filter(
      func(product) { product.category == category }
    );
    filtered;
  };

  public query func filterProductsByMaterial(material : Material) : async [Product] {
    let filtered = products.values().toArray().filter(
      func(product) { product.material == material }
    );
    filtered;
  };

  public query func filterProductsByPriceRange(min : Nat, max : Nat) : async [Product] {
    let filtered = products.values().toArray().filter(
      func(product) {
        product.price >= min and product.price <= max
      }
    );
    filtered.sort();
  };

  public query func getProductsBySearch(searchTerm : Text) : async [Product] {
    let filtered = products.values().toArray().filter(
      func(product) { product.name.contains(#text searchTerm) }
    );
    filtered;
  };

  func checkProductAvailability(productId : ProductId, quantity : Nat) : Bool {
    switch (products.get(productId)) {
      case (null) { false };
      case (?product) { product.stock >= quantity };
    };
  };

  public shared ({ caller }) func updateInventory(updates : [InventoryUpdate]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update inventory");
    };

    for (update in updates.values()) {
      switch (products.get(update.productId)) {
        case (null) {};
        case (?product) {
          let updatedProduct : Product = { product with stock = update.stock };
          products.add(update.productId, updatedProduct);
        };
      };
    };
  };

  // Customer Registration and Profile Update
  public shared ({ caller }) func registerCustomer(name : Text, email : Text, address : Text, phone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };

    let profile : CustomerProfile = {
      id = caller;
      name;
      email;
      address;
      phone;
    };
    customers.add(caller, profile);
  };

  public shared ({ caller }) func updateCustomerProfile(name : Text, email : Text, address : Text, phone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update profiles");
    };

    switch (customers.get(caller)) {
      case (null) { Runtime.trap("Customer not found") };
      case (profile) {
        let updatedProfile : CustomerProfile = {
          id = caller;
          name;
          email;
          address;
          phone;
        };
        customers.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getCustomerProfile(customerId : CustomerId) : async CustomerProfile {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
        Runtime.trap("Unauthorized: Only authenticated users can view profiles");
      };
      if (caller != customerId) {
        Runtime.trap("Unauthorized: Can only view your own profile");
      };
    };

    switch (customers.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?profile) { profile };
    };
  };

  // Cart management - user-only operations
  public shared ({ caller }) func addToCart(productId : ProductId, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add items to cart");
    };

    if (quantity == 0) { Runtime.trap("Invalid quantity") };
    if (not checkProductAvailability(productId, quantity)) {
      Runtime.trap("Product not available in requested quantity");
    };

    let currentCart = switch (carts.get(caller)) {
      case (null) { { items = [] } };
      case (?cart) { cart };
    };

    let newItems = List.empty<CartItem>();
    for (item in currentCart.items.values()) {
      newItems.add(item);
    };

    newItems.add({ productId; quantity });

    let cart : Cart = {
      items = newItems.toArray();
    };

    carts.add(caller, cart);
  };

  public shared ({ caller }) func removeFromCart(productId : ProductId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can remove items from cart");
    };

    let currentCart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart not found") };
      case (?cart) { cart };
    };

    let filteredItems = currentCart.items.filter(
      func(item) { item.productId != productId }
    );

    let cart : Cart = {
      items = filteredItems;
    };
    carts.add(caller, cart);
  };

  public query ({ caller }) func getCart() : async Cart {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view cart");
    };

    switch (carts.get(caller)) {
      case (null) { { items = [] } };
      case (?cart) { cart };
    };
  };

  // Order management
  public shared ({ caller }) func placeOrder() : async OrderId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can place orders");
    };

    let cart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart not found") };
      case (?cart) { cart };
    };

    if (cart.items.size() == 0) { Runtime.trap("Cart is empty") };

    let orderItems = cart.items.map(
      func(cartItem) {
        switch (products.get(cartItem.productId)) {
          case (null) { Runtime.trap("Product not found") };
          case (?product) {
            {
              productId = product.id;
              quantity = cartItem.quantity;
              price = product.price;
            };
          };
        };
      }
    );

    let total = orderItems.foldLeft(0, func(acc, item) { acc + (item.price * item.quantity) });

    let order : Order = {
      id = nextOrderId;
      customerId = caller;
      items = orderItems;
      totalAmount = total;
      status = #pending;
      createdAt = Time.now();
    };

    orders.add(nextOrderId, order);
    newOrders.add(nextOrderId, true);
    nextOrderId += 1;

    carts.remove(caller);

    order.id;
  };

  public query ({ caller }) func getOrder(orderId : OrderId) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view orders");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (caller != order.customerId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        order;
      };
    };
  };

  public query ({ caller }) func getCustomerOrders(customerId : CustomerId) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view orders");
    };

    if (caller != customerId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };

    let filtered = orders.values().toArray().filter(
      func(order) { order.customerId == customerId }
    );
    filtered;
  };

  public shared ({ caller }) func updateOrderStatus(orderId : OrderId, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder : Order = { order with status };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func cancelOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can cancel orders");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (caller != order.customerId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only cancel your own orders");
        };

        switch (order.status) {
          case (#pending) {
            let updatedOrder : Order = { order with status = #cancelled };
            orders.add(orderId, updatedOrder);
          };
          case (#completed) {
            let updatedOrder : Order = { order with status = #cancelled };
            orders.add(orderId, updatedOrder);
          };
          case (#shipped) {
            Runtime.trap("Cannot cancel shipped orders");
          };
          case (#delivered) {
            Runtime.trap("Cannot cancel delivered orders");
          };
          case (#cancelled) {
            Runtime.trap("Order is already cancelled");
          };
        };
      };
    };
  };

  // Admin only queries for orders with customer details
  public query ({ caller }) func getAllOrdersWithCustomerDetails() : async [OrderWithCustomerDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get list of all orders");
    };

    let resultsList = List.empty<OrderWithCustomerDetails>();

    let ordersArray = orders.values().toArray();
    let customersArray = customers.toArray();

    func findCustomer(customerId : Principal.Principal) : ?CustomerProfile {
      for ((id, customerProfile) in customersArray.values()) {
        if (Principal.equal(id, customerId)) {
          return ?customerProfile;
        };
      };
      null;
    };

    for (order in ordersArray.values()) {
      let customerProfile = findCustomer(order.customerId);

      switch (customerProfile) {
        case (?customer) {
          let orderWithDetails : OrderWithCustomerDetails = {
            order;
            customer;
            isNew = false;
            lastStatusUpdate = Time.now();
          };
          resultsList.add(orderWithDetails);
        };
        case (null) {};
      };
    };

    resultsList.toArray();
  };

  public query ({ caller }) func getOrderWithCustomerDetails(orderId : OrderId) : async OrderWithCustomerDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view order details");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let customerProfile = customers.get(order.customerId);
        switch (customerProfile) {
          case (null) { Runtime.trap("Customer profile not found") };
          case (?customer) {
            { order; customer; isNew = false; lastStatusUpdate = Time.now() };
          };
        };
      };
    };
  };

  public query ({ caller }) func getPendingOrdersWithCustomerDetails() : async [OrderWithCustomerDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get list of all pending orders");
    };

    let resultsList = List.empty<OrderWithCustomerDetails>();

    func findCustomer(customerId : Principal.Principal) : ?CustomerProfile {
      let customersArray = customers.toArray();
      for ((id, customerProfile) in customersArray.values()) {
        if (Principal.equal(id, customerId)) {
          return ?customerProfile;
        };
      };
      null;
    };

    switch (orders.isEmpty()) {
      case (true) { return [] };
      case (false) {
        for (order in orders.values()) {
          if (order.status == #pending) {
            let customerProfile = findCustomer(order.customerId);
            switch (customerProfile) {
              case (?customer) {
                let orderWithDetails : OrderWithCustomerDetails = {
                  order;
                  customer;
                  isNew = false;
                  lastStatusUpdate = Time.now();
                };
                resultsList.add(orderWithDetails);
              };
              case (null) {};
            };
          };
        };
      };
    };

    resultsList.toArray();
  };

  // ANALYTICS - Open to all for tracking purposes
  public shared func recordVisit(page : Text, browser : Text, device : Text, location : Text, sessionId : Text) : async () {
    let visitId = nextVisitId;
    let visit : Visit = {
      id = visitId;
      timestamp = Time.now();
      page;
      browser;
      device;
      location;
      sessionId;
    };
    visits.add(visitId, visit);
    nextVisitId += 1;
  };

  public shared func recordDownload(browser : Text, device : Text, platform : Text, version : Text, location : Text, sessionId : Text) : async () {
    let downloadId = nextDownloadId;
    let download : Download = {
      id = downloadId;
      timestamp = Time.now();
      browser;
      device;
      platform;
      version;
      location;
      sessionId;
    };
    downloads.add(downloadId, download);
    nextDownloadId += 1;
  };

  public query ({ caller }) func getAllVisits() : async [Visit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get analytics");
    };
    visits.values().toArray();
  };

  public query ({ caller }) func getAllDownloads() : async [Download] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get downloads");
    };
    downloads.values().toArray();
  };

  public query ({ caller }) func getVisitCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get analytics");
    };
    visits.size();
  };

  public query ({ caller }) func getDownloadCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get downloads");
    };
    downloads.size();
  };

  public query ({ caller }) func getFilteredVisits(page : Text) : async [Visit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get analytics");
    };

    let filtered = visits.values().toArray().filter(
      func(visit) { visit.page.contains(#text page) }
    );
    filtered;
  };

  public query ({ caller }) func getFilteredDownloads(platform : Text) : async [Download] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get downloads");
    };

    let filtered = downloads.values().toArray().filter(
      func(download) { download.platform.contains(#text platform) }
    );
    filtered;
  };

  // REAL-TIME ORDER POLLING (NEW)
  public query ({ caller }) func getRecentOrdersForPolling(timestamp : Int) : async [OrderWithCustomerDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get list of recent orders");
    };

    let resultsList = List.empty<OrderWithCustomerDetails>();
    let ordersArray = orders.values().toArray();
    let customersArray = customers.toArray();

    func findCustomer(customerId : Principal.Principal) : ?CustomerProfile {
      for ((id, customerProfile) in customersArray.values()) {
        if (Principal.equal(id, customerId)) {
          return ?customerProfile;
        };
      };
      null;
    };

    for (order in ordersArray.values()) {
      if (order.createdAt > timestamp) {
        let customerProfile = findCustomer(order.customerId);

        switch (customerProfile) {
          case (?customer) {
            let orderWithDetails : OrderWithCustomerDetails = {
              order;
              customer;
              isNew = true;
              lastStatusUpdate = Time.now();
            };
            resultsList.add(orderWithDetails);
          };
          case (null) {};
        };
      };
    };

    resultsList.toArray();
  };

  public query ({ caller }) func getNewAndUpdatedOrders(sinceTimestamp : Int) : async [OrderWithCustomerDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get list of new/updated orders");
    };

    let resultsList = List.empty<OrderWithCustomerDetails>();
    let ordersArray = orders.values().toArray();
    let customersArray = customers.toArray();

    func findCustomer(customerId : Principal.Principal) : ?CustomerProfile {
      for ((id, customerProfile) in customersArray.values()) {
        if (Principal.equal(id, customerId)) {
          return ?customerProfile;
        };
      };
      null;
    };

    for (order in ordersArray.values()) {
      if (order.createdAt > sinceTimestamp) {
        let customerProfile = findCustomer(order.customerId);

        switch (customerProfile) {
          case (?customer) {
            let orderWithDetails : OrderWithCustomerDetails = {
              order;
              customer;
              isNew = true;
              lastStatusUpdate = Time.now();
            };
            resultsList.add(orderWithDetails);
          };
          case (null) {};
        };
      };
    };

    resultsList.toArray();
  };

  public query ({ caller }) func getOrdersForPolling() : async [OrderWithCustomerDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get list of all orders for polling");
    };

    let resultsList = List.empty<OrderWithCustomerDetails>();
    let ordersArray = orders.values().toArray();
    let customersArray = customers.toArray();

    func findCustomer(customerId : Principal.Principal) : ?CustomerProfile {
      for ((id, customerProfile) in customersArray.values()) {
        if (Principal.equal(id, customerId)) {
          return ?customerProfile;
        };
      };
      null;
    };

    for (order in ordersArray.values()) {
      let customerProfile = findCustomer(order.customerId);

      switch (customerProfile) {
        case (?customer) {
          let orderWithDetails : OrderWithCustomerDetails = {
            order;
            customer;
            isNew = false;
            lastStatusUpdate = Time.now();
          };
          resultsList.add(orderWithDetails);
        };
        case (null) {};
      };
    };

    resultsList.toArray();
  };

  public query ({ caller }) func getNewAndUpdatedOrdersWithCustomerDetails(lastFetchTimestamp : Int) : async [OrderWithCustomerDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get new/updated orders");
    };

    let resultsList = List.empty<OrderWithCustomerDetails>();
    let ordersArray = orders.values().toArray();
    let customersArray = customers.toArray();

    func findCustomer(customerId : Principal.Principal) : ?CustomerProfile {
      for ((id, customerProfile) in customersArray.values()) {
        if (Principal.equal(id, customerId)) {
          return ?customerProfile;
        };
      };
      null;
    };

    for (order in ordersArray.values()) {
      if (order.createdAt > lastFetchTimestamp) {
        let customerProfile = findCustomer(order.customerId);

        switch (customerProfile) {
          case (?customer) {
            let orderWithDetails : OrderWithCustomerDetails = {
              order;
              customer;
              isNew = true;
              lastStatusUpdate = Time.now();
            };
            resultsList.add(orderWithDetails);
          };
          case (null) {};
        };
      };
    };

    resultsList.toArray();
  };

  // Utility function to get current system time
  public query func getCurrentSystemTime() : async Int {
    Time.now();
  };

  // ----- STRIPE INTEGRATION -----
  var configuration : ?Stripe.StripeConfiguration = null;
  public type ShoppingItem = Stripe.ShoppingItem;

  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};
