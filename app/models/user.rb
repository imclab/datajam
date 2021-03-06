class User
  include Mongoid::Document
  include Mongoid::Timestamps

  devise :database_authenticatable, :lockable,
         :recoverable, :rememberable, :trackable, :validatable

  field :name,        type: String
  field :affiliation, type: String
  field :url,         type: String

  index :name
  index :affiliation
  index :url

  mount_uploader :avatar, AvatarUploader

  default_scope order_by([:name, :asc])

  def as_json(options={})
    super(
      options.merge(
        :only => [
          :_id,
          :affiliation,
          :created_at,
          :email,
          :name,
          :updated_at,
          :url
        ],
        :methods => [
          :small_avatar_url
        ]
      )
    )
  end

  def small_avatar_url
    avatar_url(:small)
  end
end
