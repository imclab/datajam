class Setting
  include Mongoid::Document
  include Mongoid::Timestamps

  field :namespace, type: String
  field :name, type: String
  field :value, type: String
  field :required, type: Boolean, default: false
  field :callbacks, type: Array, default: []

  index [[:namespace, Mongo::ASCENDING], [:name, Mongo::ASCENDING]], unique: true

  validates_presence_of :namespace, :name
  validates_uniqueness_of :name, :scope => :namespace
  # required fields can still be created blank
  validates_presence_of :value, :if => :required, :on => :update

  after_save do
    Datajam::Settings.flush(self.namespace)
    if callbacks.any?
      callbacks.each do |callback|
        func = "#{namespace}_#{callback}".to_sym
        self.send func
      end
    end
  end

  def self.bulk_update(settings)
    errors = {}
    settings.each do |id, params|
      setting = Setting.find(id)
      unless setting.update_attributes(params)
        errors[id] = setting.errors
      end
    end
    if errors.any?
      {:updated => false, :errors => errors}
    else
      {:updated => true}
    end
  end

end
