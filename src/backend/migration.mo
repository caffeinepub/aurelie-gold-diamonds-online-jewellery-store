import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import List "mo:core/List";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

module {
  type ProductId = Nat;
  type OrderId = Nat;
  type CustomerId = Principal.Principal;

  type ProductCategory = {
    #ring;
    #headpiece;
    #bracelet;
    #diamond;
  };

  type Material = {
    #_22K_gold;
    #_18K_gold;
    #_9K_gold;
  };

  // Old format: material was just a Text type
  type OldProduct = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : ProductCategory;
    material : Text;
    stock : Nat;
    images : [Storage.ExternalBlob];
  };

  // Used in new format of maps in actor
  type OldActor = {
    products : Map.Map<ProductId, OldProduct>;
    nextProductId : Nat;
    customers : Map.Map<CustomerId, {
      id : Principal.Principal;
      name : Text;
      email : Text;
      address : Text;
      phone : Text;
    }>;
    orders : Map.Map<OrderId, {
      id : OrderId;
      customerId : Principal.Principal;
      items : [{
        productId : ProductId;
        quantity : Nat;
        price : Nat;
      }];
      totalAmount : Nat;
      status : {
        #pending;
        #completed;
        #cancelled;
        #shipped;
        #delivered;
      };
      createdAt : Int;
    }>;
    nextOrderId : Nat;
    carts : Map.Map<Principal.Principal, {
      items : [{
        productId : Nat;
        quantity : Nat;
      }];
    }>;
    newOrders : Map.Map<OrderId, Bool>;
    adminEmails : Map.Map<Principal.Principal, Text>;
    contactInfo : {
      storeName : Text;
      storeAddress : Text;
      email : Text;
      phone : Text;
      description : Text;
      gstNumber : Text;
      bankAccount : Text;
      ifscCode : Text;
    };
    nextVisitId : Nat;
    nextDownloadId : Nat;
    currentLogo : ?{
      id : Nat;
      image : Storage.ExternalBlob;
      uploadTimestamp : Int;
      version : Nat;
    };
    visits : Map.Map<Nat, {
      id : Nat;
      timestamp : Int;
      page : Text;
      browser : Text;
      device : Text;
      location : Text;
      sessionId : Text;
    }>;
    downloads : Map.Map<Nat, {
      id : Nat;
      timestamp : Int;
      browser : Text;
      device : Text;
      platform : Text;
      version : Text;
      location : Text;
      sessionId : Text;
    }>;
    userProfiles : Map.Map<Principal.Principal, {
      name : Text;
      email : Text;
      address : Text;
      phone : Text;
    }>;
    accessControlState : AccessControl.AccessControlState;
  };

  // New format for Product with explicit Material type
  type NewProduct = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : ProductCategory;
    material : Material;
    stock : Nat;
    images : [Storage.ExternalBlob];
  };

  // Used in new format of maps in actor
  type NewActor = {
    products : Map.Map<ProductId, NewProduct>;
    nextProductId : Nat;
    customers : Map.Map<CustomerId, {
      id : Principal.Principal;
      name : Text;
      email : Text;
      address : Text;
      phone : Text;
    }>;
    orders : Map.Map<OrderId, {
      id : OrderId;
      customerId : Principal.Principal;
      items : [{
        productId : ProductId;
        quantity : Nat;
        price : Nat;
      }];
      totalAmount : Nat;
      status : {
        #pending;
        #completed;
        #cancelled;
        #shipped;
        #delivered;
      };
      createdAt : Int;
    }>;
    nextOrderId : Nat;
    carts : Map.Map<Principal.Principal, {
      items : [{
        productId : Nat;
        quantity : Nat;
      }];
    }>;
    newOrders : Map.Map<OrderId, Bool>;
    adminEmails : Map.Map<Principal.Principal, Text>;
    contactInfo : {
      storeName : Text;
      storeAddress : Text;
      email : Text;
      phone : Text;
      description : Text;
      gstNumber : Text;
      bankAccount : Text;
      ifscCode : Text;
    };
    nextVisitId : Nat;
    nextDownloadId : Nat;
    currentLogo : ?{
      id : Nat;
      image : Storage.ExternalBlob;
      uploadTimestamp : Int;
      version : Nat;
    };
    visits : Map.Map<Nat, {
      id : Nat;
      timestamp : Int;
      page : Text;
      browser : Text;
      device : Text;
      location : Text;
      sessionId : Text;
    }>;
    downloads : Map.Map<Nat, {
      id : Nat;
      timestamp : Int;
      browser : Text;
      device : Text;
      platform : Text;
      version : Text;
      location : Text;
      sessionId : Text;
    }>;
    userProfiles : Map.Map<Principal.Principal, {
      name : Text;
      email : Text;
      address : Text;
      phone : Text;
    }>;
    accessControlState : AccessControl.AccessControlState;
  };

  // Intended to run on upgrade and convert old actor format to new actor format
  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, OldProduct, NewProduct>(
      func(_productId, oldProduct) {
        { oldProduct with material = convertMaterial(oldProduct.material) };
      }
    );
    { old with products = newProducts };
  };

  func convertMaterial(text : Text) : Material {
    if (text == "22K") { return #_22K_gold };
    if (text == "18K") { return #_18K_gold };
    if (text == "9K") { return #_9K_gold };

    // Fallback: Attempt to parse "22", "18", "9" variations
    if (text.contains(#text "22")) { return #_22K_gold };
    if (text.contains(#text "18")) { return #_18K_gold };
    if (text.contains(#text "9")) { return #_9K_gold };

    #_18K_gold;
  };
};
